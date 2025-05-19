import * as vscode from 'vscode';
import { ApiClient } from '../api/client';

export interface HyperfocusContext {
    reason: 'manual' | 'complex_file' | 'peak_time';
    complexity?: number;
    fileName?: string;
}

export class HyperfocusManager {
    private static instance: HyperfocusManager;
    private apiClient: ApiClient;
    private config: vscode.WorkspaceConfiguration;
    public isActive: boolean = false;
    private startTime: number | null = null;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];

    private constructor() {
        this.apiClient = new ApiClient();
        this.config = vscode.workspace.getConfiguration('tdahDevHelper');
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'tdah-dev-helper.stopFocus';
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

    public async activateHyperfocus(context: HyperfocusContext): Promise<void> {
        if (this.isActive) {
            return;
        }

        try {
            // Registrar início da sessão
            this.startTime = Date.now();
            await this.apiClient.logFocusSession({
                start_time: this.startTime,
                trigger: context.reason,
                file_complexity: context.complexity,
                file_name: context.fileName
            });

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
        }
    }

    public async deactivateHyperfocus(): Promise<void> {
        if (!this.isActive) {
            return;
        }

        try {
            // Registrar fim da sessão
            if (this.startTime) {
                const duration = Date.now() - this.startTime;
                await this.apiClient.endFocusSession({ duration });
            }

            // Desativar modo hiperfoco
            this.isActive = false;
            this.startTime = null;
            this.statusBarItem.hide();

            // Restaurar configurações normais
            await this.restoreNormalSettings();

            // Mostrar notificação
            vscode.window.showInformationMessage('Modo Hiperfoco desativado');

        } catch (error) {
            console.error('Erro ao desativar modo hiperfoco:', error);
            vscode.window.showErrorMessage('Erro ao desativar modo hiperfoco');
        }
    }

    private async applyHyperfocusSettings(): Promise<void> {
        // Bloquear notificações se configurado
        if (this.config.get('notifications.blockDuringFocus', true)) {
            // Implementar bloqueio de notificações
        }

        // Aplicar tema de hiperfoco
        // TODO: Implementar mudança de tema

        // Esconder barra lateral se configurado
        // TODO: Implementar ocultação da barra lateral
    }

    private async restoreNormalSettings(): Promise<void> {
        // Restaurar notificações
        // TODO: Implementar restauração de notificações

        // Restaurar tema normal
        // TODO: Implementar restauração de tema

        // Restaurar barra lateral
        // TODO: Implementar restauração da barra lateral
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
} 