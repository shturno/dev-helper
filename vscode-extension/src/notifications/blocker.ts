import * as vscode from 'vscode';
// import { Logger } from '../utils/logger';

export interface BlockedNotification {
    type: 'info' | 'warning' | 'error' | 'blocked';
    message: string;
    timestamp: number;
}

type InfoNotification = typeof vscode.window.showInformationMessage;
type WarningNotification = typeof vscode.window.showWarningMessage;
type ErrorNotification = typeof vscode.window.showErrorMessage;

type NotificationMethod = InfoNotification | WarningNotification | ErrorNotification;

export class NotificationBlocker {
    private isBlocking: boolean = false;
    private blockedNotifications: BlockedNotification[] = [];
    private disposables: vscode.Disposable[] = [];
    private statusBarItem: vscode.StatusBarItem;
    private isInitialized: boolean = false;

    public constructor(_context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.text = '$(bell-slash) Notificações Bloqueadas';
        this.statusBarItem.tooltip = 'Clique para ver notificações bloqueadas';
        this.statusBarItem.command = 'dev-helper.showBlockedNotifications';
        
        // Registrar o comando para mostrar notificações bloqueadas
        this.disposables.push(
            vscode.commands.registerCommand('dev-helper.showBlockedNotifications', () => {
                this.showBlockedNotifications();
            })
        );
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Substituir métodos de notificação
        const originalShowInfo = vscode.window.showInformationMessage;
        const originalShowWarning = vscode.window.showWarningMessage;
        const originalShowError = vscode.window.showErrorMessage;

        // Handler para notificações
        const handleNotification = (
            originalFn: NotificationMethod,
            message: string,
            ...args: (string | vscode.MessageItem)[]
        ): unknown => {
            if (this.isBlocking) {
                let type: BlockedNotification['type'] = 'info';
                if (originalFn === originalShowWarning) type = 'warning';
                if (originalFn === originalShowError) type = 'error';
                this.blockedNotifications.push({
                    type,
                    message,
                    timestamp: Date.now()
                });
                this.updateStatusBar();
                return Promise.resolve(undefined);
            }
            if (args.length === 0) {
                return originalFn(message);
            }
            if (args.every(arg => typeof arg === 'string')) {
                return (originalFn as (msg: string, ...items: string[]) => Thenable<string | undefined>)(message, ...(args as string[]));
            }
            if (args.every(arg => typeof arg === 'object')) {
                return (originalFn as (msg: string, ...items: vscode.MessageItem[]) => Thenable<vscode.MessageItem | undefined>)(message, ...(args as vscode.MessageItem[]));
            }
            return originalFn(message);
        };

        // Substituir métodos originais
        const createNotificationWrapper = (originalFn: NotificationMethod): NotificationMethod => {
            return function(message: string, ...args: (string | vscode.MessageItem)[]): unknown {
                return handleNotification(originalFn, message, ...args);
            } as NotificationMethod;
        };

        vscode.window.showInformationMessage = createNotificationWrapper(originalShowInfo);
        vscode.window.showWarningMessage = createNotificationWrapper(originalShowWarning);
        vscode.window.showErrorMessage = createNotificationWrapper(originalShowError);

        // Restaurar métodos originais ao desativar
        this.disposables.push({
            dispose: (): void => {
                vscode.window.showInformationMessage = originalShowInfo;
                vscode.window.showWarningMessage = originalShowWarning;
                vscode.window.showErrorMessage = originalShowError;
            }
        });

        // Inicialização do NotificationBlocker
        this.loadBlockedNotifications();
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
    }

    public startBlocking(): void {
        if (this.isBlocking) return;
        
        this.isBlocking = true;
        this.blockedNotifications = [];
        this.statusBarItem.show();
        
        // Mostrar notificação inicial
        const originalShowInfo = vscode.window.showInformationMessage;
        originalShowInfo('Notificações bloqueadas durante o modo hiperfoco');
    }

    public stopBlocking(): void {
        if (!this.isBlocking) return;
        
        this.isBlocking = false;
        this.statusBarItem.hide();
        
        // Mostrar notificações bloqueadas se houver
        if (this.blockedNotifications.length > 0) {
            this.showBlockedNotifications();
        }
    }

    public showBlockedNotifications(): void {
        if (this.blockedNotifications.length === 0) {
            vscode.window.showInformationMessage('Nenhuma notificação bloqueada');
            return;
        }

        // Criar mensagem formatada
        const message = this.blockedNotifications
            .map(n => `[${this.formatTimestamp(n.timestamp)}] ${n.message}`)
            .join('\n\n');

        // Mostrar em um webview
        const panel = vscode.window.createWebviewPanel(
            'blockedNotifications',
            'Notificações Bloqueadas',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getWebviewContent(message);
    }

    public blockNotification(message: string): boolean {
        if (!this.isBlocking || !message) {
            return false;
        }
        const notification: BlockedNotification = {
            type: 'blocked',
            message,
            timestamp: Date.now(),
        };
        this.blockedNotifications.push(notification);
        this.updateStatusBar();
        return true;
    }

    private formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    private getWebviewContent(message: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .notification {
                        margin-bottom: 15px;
                        padding: 10px;
                        border-radius: 4px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                    }
                    .timestamp {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                    }
                </style>
            </head>
            <body>
                <h2>Notificações Bloqueadas</h2>
                <div id="notifications">
                    ${message.split('\n\n').map(msg => `
                        <div class="notification">
                            ${msg}
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;
    }

    private loadBlockedNotifications(): void {
        // Implementação futura se necessário
    }

    private updateStatusBar(): void {
        const count = this.blockedNotifications.length;
        this.statusBarItem.text = `$(bell-slash) ${count} Notificação${count !== 1 ? 's' : ''} Bloqueada${count !== 1 ? 's' : ''}`;
    }
} 