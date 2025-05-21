import * as vscode from 'vscode';

export interface HyperfocusContext {
    reason: 'manual' | 'complex_file' | 'peak_time';
    complexity?: number;
    fileName?: string;
}

export class HyperfocusManager {
    private static instance: HyperfocusManager;
    private config: vscode.WorkspaceConfiguration;
    public isActive: boolean = false;
    private startTime: number | null = null;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private originalSettings: {
        theme: string;
        sidebarVisible: boolean;
        minimapEnabled: boolean;
        fontSize: number;
    } | null = null;
    private stats = {
        todayMinutes: 0,
        streak: 0,
        totalMinutes: 0,
        sessions: 0,
        lastSessionDate: null as Date | null
    };

    private constructor() {
        this.config = vscode.workspace.getConfiguration('tdahDevHelper');
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'tdah-dev-helper.stopFocus';
        this.loadStats();
    }

    public static getInstance(): HyperfocusManager {
        if (!HyperfocusManager.instance) {
            HyperfocusManager.instance = new HyperfocusManager();
        }
        return HyperfocusManager.instance;
    }

    public initialize(): void {
        // Configurar status bar
        this.statusBarItem.text = '$(eye) TDAH: Modo Hiperfoco';
        this.statusBarItem.tooltip = 'Clique para desativar o modo hiperfoco';
        this.statusBarItem.hide();

        // Registrar eventos
        this.disposables.push(
            vscode.window.onDidChangeWindowState(this.handleWindowStateChange.bind(this))
        );
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
    }

    private loadStats(): void {
        try {
            const savedStats = this.config.get('hyperfocusStats', {
                todayMinutes: 0,
                streak: 0,
                totalMinutes: 0,
                sessions: 0,
                lastSessionDate: null
            });

            this.stats = {
                ...savedStats,
                lastSessionDate: savedStats.lastSessionDate ? new Date(savedStats.lastSessionDate) : null
            };

            // Reset today's minutes if it's a new day
            if (this.stats.lastSessionDate) {
                const today = new Date();
                const lastSession = new Date(this.stats.lastSessionDate);
                if (today.toDateString() !== lastSession.toDateString()) {
                    this.stats.todayMinutes = 0;
                    // Update streak
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
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    private async saveStats(): Promise<void> {
        try {
            await this.config.update('hyperfocusStats', {
                ...this.stats,
                lastSessionDate: this.stats.lastSessionDate?.toISOString()
            }, true);
        } catch (error) {
            console.error('Erro ao salvar estatísticas:', error);
        }
    }

    public getStats() {
        return { ...this.stats };
    }

    public async activateHyperfocus(context: HyperfocusContext): Promise<void> {
        if (this.isActive) {
            return;
        }

        try {
            // Salvar configurações atuais
            this.saveCurrentSettings();
            
            // Registrar início da sessão
            this.startTime = Date.now();
            
            // Ativar modo hiperfoco
            this.isActive = true;
            this.statusBarItem.show();

            // Aplicar configurações de hiperfoco
            await this.applyHyperfocusSettings();

            // Mostrar notificação
            vscode.window.showInformationMessage(
                `Modo Hiperfoco ativado! ${this.getActivationReasonMessage(context)}`
            );

        } catch (error) {
            console.error('Erro ao ativar modo hiperfoco:', error);
            vscode.window.showErrorMessage('Erro ao ativar modo hiperfoco');
            // Restaurar configurações em caso de erro
            await this.restoreNormalSettings();
        }
    }

    public async deactivateHyperfocus(): Promise<void> {
        if (!this.isActive) {
            return;
        }

        try {
            // Calcular duração da sessão
            const duration = this.getSessionDurationInMinutes();
            if (duration > 0) {
                this.stats.todayMinutes += duration;
                this.stats.totalMinutes += duration;
                this.stats.sessions++;
                this.stats.lastSessionDate = new Date();
                await this.saveStats();
            }

            // Desativar modo hiperfoco
            this.isActive = false;
            this.startTime = null;
            this.statusBarItem.hide();

            // Restaurar configurações normais
            await this.restoreNormalSettings();

            // Mostrar notificação com duração da sessão
            vscode.window.showInformationMessage(
                `Modo Hiperfoco desativado. Duração: ${this.formatDuration(duration)}`
            );

        } catch (error) {
            console.error('Erro ao desativar modo hiperfoco:', error);
            vscode.window.showErrorMessage('Erro ao desativar modo hiperfoco');
        }
    }

    private saveCurrentSettings(): void {
        const config = vscode.workspace.getConfiguration();
        this.originalSettings = {
            theme: config.get('workbench.colorTheme', 'Default Dark+'),
            sidebarVisible: true,
            minimapEnabled: config.get('editor.minimap.enabled', true),
            fontSize: config.get('editor.fontSize', 14)
        };
    }

    private async applyHyperfocusSettings(): Promise<void> {
        const config = vscode.workspace.getConfiguration();

        // Aplicar tema de hiperfoco
        const theme = this.config.get('theme', 'tdah-dark');
        await config.update('workbench.colorTheme', theme, true);

        // Esconder barra lateral se configurado
        if (this.config.get('hideSidebar', true)) {
            try {
                await vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
            } catch (error) {
                console.warn('Não foi possível esconder a barra lateral:', error);
            }
        }

        // Esconder minimapa se configurado
        if (this.config.get('hideMinimap', true)) {
            await config.update('editor.minimap.enabled', false, true);
        }

        // Aumentar tamanho da fonte se configurado
        if (this.config.get('increaseFontSize', true)) {
            const currentSize = config.get('editor.fontSize', 14);
            await config.update('editor.fontSize', currentSize + 2, true);
        }

        // Desativar distrações
        await config.update('editor.wordWrap', 'off', true);
        await config.update('editor.renderWhitespace', 'none', true);
        await config.update('editor.guides.bracketPairs', false, true);
        await config.update('editor.suggest.showWords', false, true);
    }

    private async restoreNormalSettings(): Promise<void> {
        if (!this.originalSettings) {
            return;
        }

        const config = vscode.workspace.getConfiguration();

        // Restaurar todas as configurações originais
        await Promise.all([
            config.update('workbench.colorTheme', this.originalSettings.theme, true),
            config.update('editor.minimap.enabled', this.originalSettings.minimapEnabled, true),
            config.update('editor.fontSize', this.originalSettings.fontSize, true),
            config.update('editor.wordWrap', 'on', true),
            config.update('editor.renderWhitespace', 'all', true),
            config.update('editor.guides.bracketPairs', true, true),
            config.update('editor.suggest.showWords', true, true)
        ]);

        // Restaurar barra lateral se necessário
        if (this.config.get('hideSidebar', true)) {
            try {
                await vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
            } catch (error) {
                console.warn('Não foi possível restaurar a barra lateral:', error);
            }
        }

        this.originalSettings = null;
    }

    private handleWindowStateChange(e: vscode.WindowState): void {
        // Desativar hiperfoco se a janela perder o foco
        if (this.isActive && !e.focused) {
            this.deactivateHyperfocus();
        }
    }

    private getActivationReasonMessage(context: HyperfocusContext): string {
        switch (context.reason) {
            case 'manual':
                return 'Ativado manualmente';
            case 'complex_file':
                return `Arquivo complexo detectado (${context.fileName})`;
            case 'peak_time':
                return 'Horário de pico de produtividade';
            default:
                return '';
        }
    }

    private getSessionDurationInMinutes(): number {
        if (!this.startTime) {
            return 0;
        }
        return Math.floor((Date.now() - this.startTime) / 1000 / 60);
    }

    private formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins} minutos`;
    }
} 