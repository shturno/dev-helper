import * as vscode from 'vscode';
import { Logger } from '../utils/logger'; // Assuming logger is in utils

const logger = Logger.getInstance();

export interface HyperfocusContext {
    reason: 'manual' | 'complex_file' | 'peak_time' | 'restore';
    complexity?: number;
    fileName?: string;
}

export class HyperfocusManager {
    private static instance: HyperfocusManager;
    public isActive: boolean = false;
    private startTime: number | null = null;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private originalSettings: {
        theme: string | undefined;
        sidebarVisible: boolean; 
        minimapEnabled: boolean | undefined;
        fontSize: number | undefined;
    } | null = null;

    private stats = {
        todayMinutes: 0,
        streak: 0,
        totalMinutes: 0,
        sessions: 0,
        lastSessionDate: null as Date | null,
    };

    private constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            97 // Priority
        );
    }

    public static getInstance(context: vscode.ExtensionContext): HyperfocusManager {
        if (!HyperfocusManager.instance) {
            HyperfocusManager.instance = new HyperfocusManager(context);
        }
        return HyperfocusManager.instance;
    }

    public async initialize(): Promise<void> {
        this.statusBarItem.text = '$(eye) TDAH: Modo Hiperfoco';
        this.statusBarItem.tooltip = 'Clique para desativar o modo hiperfoco';
        this.statusBarItem.hide();

        try {
            this.disposables.push(
                vscode.commands.registerCommand('dev-helper.stopFocus', async () => {
                    await this.deactivateHyperfocus();
                })
            );
            this.statusBarItem.command = 'dev-helper.stopFocus';
            logger.info("Comando 'dev-helper.stopFocus' registrado com sucesso.");
        } catch (error) {
            logger.warn("Falha ao registrar o comando 'dev-helper.stopFocus', pode já estar registrado:", error as Error);
            this.statusBarItem.command = 'dev-helper.stopFocus';
        }

        this.disposables.push(
            vscode.window.onDidChangeWindowState(this.handleWindowStateChange.bind(this))
        );

        await this.loadStats();

        const lastSession = this.context.globalState.get<{ startTime: number }>('hyperfocus-last-session');
        if (lastSession && lastSession.startTime) {
            const sessionDuration = Date.now() - lastSession.startTime;
            if (sessionDuration < 4 * 60 * 60 * 1000) { // 4 hours
                const shouldRestore = await vscode.window.showWarningMessage(
                    'Uma sessão de hiperfoco anterior foi interrompida. Deseja restaurá-la?',
                    'Sim',
                    'Não'
                );
                if (shouldRestore === 'Sim') {
                    await this.activateHyperfocus({ reason: 'restore' });
                } else {
                    await this.context.globalState.update('hyperfocus-last-session', undefined);
                }
            } else {
                await this.context.globalState.update('hyperfocus-last-session', undefined);
            }
        }
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.statusBarItem.hide();
        this.statusBarItem.dispose();
        if (this.isActive) {
            this.deactivateHyperfocus(true).catch(error => {
                logger.error('Erro ao desativar hiperfoco durante dispose:', error as Error);
            });
        }
    }

    private async loadStats(): Promise<void> {
        try {
            const savedStats = this.context.globalState.get('hyperfocusStats', {
                todayMinutes: 0,
                streak: 0,
                totalMinutes: 0,
                sessions: 0,
                lastSessionDate: null as string | null,
            });

            this.stats = {
                ...savedStats,
                lastSessionDate: savedStats.lastSessionDate ? new Date(savedStats.lastSessionDate) : null,
            };
            logger.info('Estatísticas carregadas:', this.stats);

            if (this.stats.lastSessionDate) {
                const today = new Date();
                const lastSession = new Date(this.stats.lastSessionDate);
                if (today.toDateString() !== lastSession.toDateString()) {
                    this.stats.todayMinutes = 0;
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (yesterday.toDateString() === lastSession.toDateString()) {
                        this.stats.streak++;
                    } else {
                        this.stats.streak = 0;
                    }
                }
            }
        } catch (error) {
            logger.error('Erro ao carregar estatísticas:', error as Error);
            this.stats = {
                todayMinutes: 0,
                streak: 0,
                totalMinutes: 0,
                sessions: 0,
                lastSessionDate: null,
            };
        }
    }

    private async saveStats(): Promise<void> {
        try {
            await this.context.globalState.update('hyperfocusStats', {
                ...this.stats,
                lastSessionDate: this.stats.lastSessionDate?.toISOString() ?? null,
            });
            logger.info('Estatísticas salvas:', this.stats);
        } catch (error) {
            logger.error('Erro ao salvar estatísticas:', error as Error);
        }
    }

    public getStats() {
        return { ...this.stats };
    }

    public async activateHyperfocus(context?: HyperfocusContext): Promise<void> {
        if (this.isActive) {
            logger.info('Modo hiperfoco já está ativo.');
            return;
        }
        logger.info('Ativando modo hiperfoco...', context);

        try {
            this.saveCurrentSettings();
            this.startTime = Date.now();
            this.isActive = true;
            this.statusBarItem.show();

            await this.applyHyperfocusSettings();

            await this.context.globalState.update('hyperfocus-last-session', { startTime: this.startTime });

            vscode.window.showInformationMessage(
                `Modo Hiperfoco ativado! ${this.getActivationReasonMessage(context)}`
            );
            logger.info('Modo hiperfoco ativado com sucesso.');
        } catch (error) {
            logger.error('Erro ao ativar modo hiperfoco:', error as Error);
            vscode.window.showErrorMessage('Erro ao ativar modo hiperfoco. Verifique os logs.');
            await this.restoreNormalSettings();
            this.isActive = false;
            this.statusBarItem.hide();
        }
    }

    public async deactivateHyperfocus(isDisposing: boolean = false): Promise<void> {
        if (!this.isActive) {
            logger.info('Modo hiperfoco já está inativo.');
            return;
        }
        logger.info('Desativando modo hiperfoco...');

        try {
            const duration = this.getSessionDurationInMinutes();
            if (duration > 0) {
                this.stats.todayMinutes += duration;
                this.stats.totalMinutes += duration;
                this.stats.sessions++;
                this.stats.lastSessionDate = new Date();
                await this.saveStats();
            }

            if (duration > 50) {
                const { Notifier } = await import('../notifications/notifier');
                Notifier.suggestBreak();
            }

            this.isActive = false;
            this.startTime = null;
            this.statusBarItem.hide();

            await this.restoreNormalSettings();
            await this.context.globalState.update('hyperfocus-last-session', undefined);

            if (!isDisposing) {
                vscode.window.showInformationMessage(
                    `Modo Hiperfoco desativado. Duração: ${this.formatDuration(duration)}`
                );
            }
            logger.info('Modo hiperfoco desativado com sucesso.');
        } catch (error) {
            logger.error('Erro ao desativar modo hiperfoco:', error as Error);
            if (!isDisposing) {
                vscode.window.showErrorMessage('Erro ao desativar modo hiperfoco. Verifique os logs.');
            }
            this.isActive = false;
            this.statusBarItem.hide();
        }
    }

    private saveCurrentSettings(): void {
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        const editorConfig = vscode.workspace.getConfiguration('editor');

        this.originalSettings = {
            theme: workbenchConfig.get('colorTheme'),
            sidebarVisible: true, // This needs a more robust way to check current state
            minimapEnabled: editorConfig.get('minimap.enabled'),
            fontSize: editorConfig.get('fontSize'),
        };
        logger.info('Configurações atuais salvas:', this.originalSettings);
    }

    private async applyHyperfocusSettings(): Promise<void> {
        logger.info('Aplicando configurações de hiperfoco...');
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        const editorConfig = vscode.workspace.getConfiguration('editor');
        // Use hyperfocusConfig for hyperfocus specific settings from 'tdahDevHelper.hyperfocus'
        const hyperfocusConfig = vscode.workspace.getConfiguration('tdahDevHelper.hyperfocus');

        try {
            const focusTheme = hyperfocusConfig.get<string>('theme');
            if (focusTheme) {
                await workbenchConfig.update('colorTheme', focusTheme, vscode.ConfigurationTarget.Global);
            }

            if (hyperfocusConfig.get<boolean>('hideSidebar')) {
                await vscode.commands.executeCommand('workbench.action.closeSidebar');
            }

            if (hyperfocusConfig.get<boolean>('hideMinimap')) {
                await editorConfig.update('minimap.enabled', false, vscode.ConfigurationTarget.Global);
            }

            if (hyperfocusConfig.get<boolean>('increaseFontSize')) {
                const currentSize = editorConfig.get<number>('fontSize');
                if (currentSize !== undefined) {
                    await editorConfig.update('fontSize', currentSize + 2, vscode.ConfigurationTarget.Global);
                }
            }

            await editorConfig.update('wordWrap', 'off', vscode.ConfigurationTarget.Global);
            logger.info('Configurações de hiperfoco aplicadas.');

        } catch (error) {
            logger.error("Erro ao aplicar configurações de hiperfoco:", error as Error);
            vscode.window.showErrorMessage("Não foi possível aplicar todas as configurações de hiperfoco.");
        }
    }

    private async restoreNormalSettings(): Promise<void> {
        if (!this.originalSettings) {
            logger.info('Nenhuma configuração original para restaurar.');
            return;
        }
        logger.info('Restaurando configurações normais...', this.originalSettings);
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        const editorConfig = vscode.workspace.getConfiguration('editor');
        // Use hyperfocusConfig for hyperfocus specific settings from 'tdahDevHelper.hyperfocus'
        const hyperfocusConfig = vscode.workspace.getConfiguration('tdahDevHelper.hyperfocus');

        try {
            if (this.originalSettings.theme !== undefined) {
                await workbenchConfig.update('colorTheme', this.originalSettings.theme, vscode.ConfigurationTarget.Global);
            }

            // If sidebar was hidden by hyperfocus, attempt to show it.
            // This is a simplification; a robust solution would store the actual original state.
            if (hyperfocusConfig.get<boolean>('hideSidebar')) {
                await vscode.commands.executeCommand('workbench.action.openSidebar'); 
            }

            if (this.originalSettings.minimapEnabled !== undefined) {
                await editorConfig.update('minimap.enabled', this.originalSettings.minimapEnabled, vscode.ConfigurationTarget.Global);
            }

            if (this.originalSettings.fontSize !== undefined) {
                await editorConfig.update('fontSize', this.originalSettings.fontSize, vscode.ConfigurationTarget.Global);
            }

            await editorConfig.update('wordWrap', 'on', vscode.ConfigurationTarget.Global);

            this.originalSettings = null;
            logger.info('Configurações normais restauradas.');
        } catch (error) {
            logger.error("Erro ao restaurar configurações normais:", error as Error);
            vscode.window.showErrorMessage("Não foi possível restaurar todas as configurações originais. Pode ser necessário ajustar manualmente.");
        }
    }

    private async handleWindowStateChange(state: vscode.WindowState): Promise<void> {
        if (this.isActive && !state.focused) {
            logger.info('Janela do VS Code perdeu o foco durante o modo hiperfoco.');
            if (this.startTime) {
                await this.context.globalState.update('hyperfocus-last-session', {
                    startTime: this.startTime,
                });
                logger.info('Sessão de hiperfoco salva para possível restauração.');
            }
        } else if (this.isActive && state.focused) {
            logger.info('Janela do VS Code recuperou o foco durante o modo hiperfoco.');
        }
    }

    private getActivationReasonMessage(context?: HyperfocusContext): string {
        if (!context) return '';
        switch (context.reason) {
            case 'manual':
                return 'Ativado manualmente.';
            case 'complex_file':
                return `Devido à complexidade do arquivo: ${context.fileName || 'arquivo atual'}.`;
            case 'peak_time':
                return 'Estamos no seu horário de pico de produtividade!';
            case 'restore':
                return 'Restaurando sessão anterior.';
            default:
                return '';
        }
    }

    private getSessionDurationInMinutes(): number {
        if (!this.startTime) {
            return 0;
        }
        return Math.floor((Date.now() - this.startTime) / (1000 * 60));
    }

    private formatDuration(minutes: number): string {
        if (minutes < 1) return "menos de um minuto";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        let message = '';
        if (hours > 0) {
            message += `${hours} hora${hours > 1 ? 's' : ''}`;
        }
        if (mins > 0) {
            if (hours > 0) message += ' e ';
            message += `${mins} minuto${mins > 1 ? 's' : ''}`;
        }
        return message || "0 minutos";
    }
}

export function getHyperfocusManager(context?: vscode.ExtensionContext): HyperfocusManager {
    if (context && !HyperfocusManager.getInstance(context)) {
        // This condition is a bit off, getInstance will create if not exists.
        // The main point is to ensure it's called with context at least once.
    }
    // Ensure context was provided for the first call that creates the instance.
    // Subsequent calls can omit it if the instance already exists.
    if (!HyperfocusManager.getInstance(context!)) { 
        throw new Error("HyperfocusManager não foi inicializado com um contexto. Certifique-se de que o contexto da extensão é passado na primeira chamada para getInstance ou getHyperfocusManager.");
    }
    return HyperfocusManager.getInstance(context!);
}