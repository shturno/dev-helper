import * as vscode from 'vscode';

export interface BlockedNotification {
    type: string;
    message: string;
    timestamp: number;
}

export class NotificationBlocker {
    private isBlocking: boolean = false;
    private blockedNotifications: BlockedNotification[] = [];
    private disposables: vscode.Disposable[] = [];
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            99
        );
        this.statusBarItem.text = '$(bell-slash) Notificações Bloqueadas';
        this.statusBarItem.tooltip = 'Clique para ver notificações bloqueadas';
        this.statusBarItem.command = 'tdah-dev-helper.showBlockedNotifications';
    }

    public initialize(): void {
        // Substituir métodos de notificação
        const originalShowInfo = vscode.window.showInformationMessage;
        const originalShowWarning = vscode.window.showWarningMessage;
        const originalShowError = vscode.window.showErrorMessage;

        const blocker = this;

        // Handler para notificações com strings
        const handleStringNotification = function(
            originalFn: typeof vscode.window.showInformationMessage,
            message: string,
            ...items: string[]
        ): Thenable<string | undefined> {
            if (blocker.isBlocking) {
                blocker.handleNotification(message);
                return Promise.resolve(undefined);
            }
            return originalFn(message, ...items);
        };

        // Handler para notificações com MessageItems
        const handleMessageItemNotification = function(
            originalFn: typeof vscode.window.showInformationMessage,
            message: string,
            ...items: vscode.MessageItem[]
        ): Thenable<vscode.MessageItem | undefined> {
            if (blocker.isBlocking) {
                blocker.handleNotification(message);
                return Promise.resolve(undefined);
            }
            return originalFn(message, ...items);
        };

        // Substituir métodos originais
        vscode.window.showInformationMessage = function(message: string, ...items: any[]): any {
            if (items.length > 0 && typeof items[0] === 'object' && 'title' in items[0]) {
                return handleMessageItemNotification(originalShowInfo, message, ...items as vscode.MessageItem[]);
            }
            return handleStringNotification(originalShowInfo, message, ...items as string[]);
        };

        vscode.window.showWarningMessage = function(message: string, ...items: any[]): any {
            if (items.length > 0 && typeof items[0] === 'object' && 'title' in items[0]) {
                return handleMessageItemNotification(originalShowWarning, message, ...items as vscode.MessageItem[]);
            }
            return handleStringNotification(originalShowWarning, message, ...items as string[]);
        };

        vscode.window.showErrorMessage = function(message: string, ...items: any[]): any {
            if (items.length > 0 && typeof items[0] === 'object' && 'title' in items[0]) {
                return handleMessageItemNotification(originalShowError, message, ...items as vscode.MessageItem[]);
            }
            return handleStringNotification(originalShowError, message, ...items as string[]);
        };

        // Registrar comando para mostrar notificações bloqueadas
        this.disposables.push(
            vscode.commands.registerCommand(
                'tdah-dev-helper.showBlockedNotifications',
                this.showBlockedNotifications.bind(this)
            )
        );

        // Restaurar métodos originais ao desativar
        this.disposables.push({
            dispose: () => {
                vscode.window.showInformationMessage = originalShowInfo;
                vscode.window.showWarningMessage = originalShowWarning;
                vscode.window.showErrorMessage = originalShowError;
            }
        });
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
    }

    public startBlocking(): void {
        if (this.isBlocking) {
            return;
        }

        this.isBlocking = true;
        this.blockedNotifications = [];
        this.statusBarItem.show();

        vscode.window.showInformationMessage(
            'Notificações bloqueadas durante o modo hiperfoco'
        );
    }

    public stopBlocking(): void {
        if (!this.isBlocking) {
            return;
        }

        this.isBlocking = false;
        this.statusBarItem.hide();

        // Mostrar notificações bloqueadas se houver
        if (this.blockedNotifications.length > 0) {
            this.showBlockedNotifications();
        }
    }

    private handleNotification(message: string): void {
        if (!this.isBlocking) {
            return;
        }

        // Determinar o tipo de notificação
        let type = 'info';
        if (message.includes('Warning')) {
            type = 'warning';
        } else if (message.includes('Error')) {
            type = 'error';
        }

        // Adicionar à lista de notificações bloqueadas
        this.blockedNotifications.push({
            type,
            message,
            timestamp: Date.now()
        });

        // Atualizar contador na status bar
        this.updateStatusBar();
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

    private updateStatusBar(): void {
        const count = this.blockedNotifications.length;
        this.statusBarItem.text = `$(bell-slash) ${count} Notificação${count !== 1 ? 's' : ''} Bloqueada${count !== 1 ? 's' : ''}`;
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
                    .clear-button {
                        margin-top: 20px;
                        padding: 8px 16px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .clear-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
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
                <button class="clear-button" onclick="clearNotifications()">
                    Limpar Notificações
                </button>
                <script>
                    const vscode = acquireVsCodeApi();
                    function clearNotifications() {
                        vscode.postMessage({ command: 'clearNotifications' });
                    }
                </script>
            </body>
            </html>
        `;
    }
} 