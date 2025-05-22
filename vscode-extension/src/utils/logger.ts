import * as vscode from 'vscode';

/**
 * Níveis de log disponíveis
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

/**
 * Configurações do logger
 */
interface LoggerConfig {
    level: LogLevel;
    showNotifications: boolean;
    logToFile: boolean;
    logFilePath?: string;
}

/**
 * Classe utilitária para logging
 */
export class Logger {
    private static instance: Logger;
    private config: LoggerConfig;
    private disposables: vscode.Disposable[] = [];

    private constructor() {
        const workspaceConfig = vscode.workspace.getConfiguration('devHelper');
        this.config = {
            level: workspaceConfig.get('logLevel', LogLevel.INFO) as LogLevel,
            showNotifications: workspaceConfig.get('showLogNotifications', true),
            logToFile: workspaceConfig.get('logToFile', false),
            logFilePath: workspaceConfig.get('logFilePath')
        };

        // Registrar para mudanças de configuração
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('devHelper')) {
                    this.updateConfig();
                }
            })
        );
    }

    /**
     * Obtém a instância singleton do logger
     */
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Atualiza a configuração do logger
     */
    private updateConfig(): void {
        const workspaceConfig = vscode.workspace.getConfiguration('devHelper');
        this.config = {
            level: workspaceConfig.get('logLevel', LogLevel.INFO) as LogLevel,
            showNotifications: workspaceConfig.get('showLogNotifications', true),
            logToFile: workspaceConfig.get('logToFile', false),
            logFilePath: workspaceConfig.get('logFilePath')
        };
    }

    /**
     * Registra uma mensagem de debug
     */
    public debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    /**
     * Registra uma mensagem informativa
     */
    public info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    /**
     * Registra um aviso
     */
    public warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    /**
     * Registra um erro
     */
    public error(message: string, error?: Error, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, error, ...args);
    }

    /**
     * Registra uma mensagem com o nível especificado
     */
    private log(level: LogLevel, message: string, ...args: any[]): void {
        // Verificar se o nível de log está habilitado
        if (this.getLogLevelValue(level) < this.getLogLevelValue(this.config.level)) {
            return;
        }

        const timestamp = new Date().toISOString();
        const formattedMessage = this.formatMessage(level, timestamp, message, ...args);

        // Log no console
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage);
                break;
        }

        // Log em arquivo se configurado
        if (this.config.logToFile && this.config.logFilePath) {
            this.writeToFile(formattedMessage);
        }

        // Mostrar notificação se configurado
        if (this.config.showNotifications && level >= LogLevel.WARN) {
            this.showNotification(level, message);
        }
    }

    /**
     * Formata a mensagem de log
     */
    private formatMessage(level: LogLevel, timestamp: string, message: string, ...args: any[]): string {
        const prefix = `[${timestamp}] [${level}]`;
        const formattedArgs = args.map(arg => {
            if (arg instanceof Error) {
                return `${arg.message}\n${arg.stack}`;
            }
            return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
        }).join(' ');

        return `${prefix} ${message} ${formattedArgs}`.trim();
    }

    /**
     * Escreve a mensagem no arquivo de log
     */
    private async writeToFile(message: string): Promise<void> {
        try {
            const logFile = vscode.Uri.file(this.config.logFilePath!);
            const content = message + '\n';
            
            try {
                await vscode.workspace.fs.writeFile(logFile, Buffer.from(content, 'utf8'));
            } catch (error) {
                // Se o arquivo não existir, criar
                if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
                    await vscode.workspace.fs.writeFile(logFile, Buffer.from(content, 'utf8'));
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Erro ao escrever no arquivo de log:', error);
        }
    }

    /**
     * Mostra uma notificação baseada no nível de log
     */
    private showNotification(level: LogLevel, message: string): void {
        switch (level) {
            case LogLevel.WARN:
                vscode.window.showWarningMessage(`Dev Helper: ${message}`);
                break;
            case LogLevel.ERROR:
                vscode.window.showErrorMessage(`Dev Helper: ${message}`);
                break;
        }
    }

    /**
     * Obtém o valor numérico do nível de log
     */
    private getLogLevelValue(level: LogLevel): number {
        switch (level) {
            case LogLevel.DEBUG: return 0;
            case LogLevel.INFO: return 1;
            case LogLevel.WARN: return 2;
            case LogLevel.ERROR: return 3;
            default: return 1;
        }
    }

    /**
     * Limpa os recursos do logger
     */
    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
} 