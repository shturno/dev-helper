import * as vscode from 'vscode';
import { ApiClient } from './api/client';
import { ContextDetector } from './context/detector';
import { HyperfocusManager } from './hyperfocus/manager';
import { NotificationBlocker } from './notifications/blocker';
import { TaskTracker } from './tasks/tracker';
import { GamificationManager } from './gamification/manager';
import { ThemeManager } from './themes/manager';

// Componentes globais para gerenciamento de estado
let apiClient: ApiClient | null = null;
let contextDetector: ContextDetector | null = null;
let hyperfocusManager: HyperfocusManager | null = null;
let notificationBlocker: NotificationBlocker | null = null;
let taskTracker: TaskTracker | null = null;
let gamificationManager: GamificationManager | null = null;
let themeManager: ThemeManager | null = null;

export async function activate(context: vscode.ExtensionContext) {
    console.log('TDAH Dev Helper está ativo!');

    try {
        // Inicializar componentes principais
        hyperfocusManager = HyperfocusManager.getInstance();
        notificationBlocker = new NotificationBlocker();
        themeManager = ThemeManager.getInstance();
        taskTracker = new TaskTracker(context);
        gamificationManager = GamificationManager.getInstance();

        // Inicializar componentes opcionais baseados na configuração
        const config = vscode.workspace.getConfiguration('tdahDevHelper');
        const apiUrl = config.get<string>('apiUrl');
        const debug = config.get<boolean>('debug');

        if (debug) {
            console.log('TDAH Dev Helper: Modo debug ativado');
            console.log('TDAH Dev Helper: API URL:', apiUrl || 'não configurada');
        }

        if (apiUrl) {
            try {
                apiClient = new ApiClient(apiUrl);
                contextDetector = new ContextDetector(apiClient);
            } catch (error) {
                console.error('TDAH Dev Helper: Erro ao inicializar API:', error);
                vscode.window.showWarningMessage(
                    'TDAH Dev Helper: API não disponível. Algumas funcionalidades estarão limitadas.'
                );
            }
        }

        // Registrar comandos
        const disposables = [
            // Comandos de Hiperfoco
            vscode.commands.registerCommand('tdah-dev-helper.startFocus', async () => {
                try {
                    if (!hyperfocusManager) {
                        throw new Error('HyperfocusManager não inicializado');
                    }

                    await hyperfocusManager.activateHyperfocus({
                        reason: 'manual',
                        complexity: 0
                    });

                    if (notificationBlocker) {
                        notificationBlocker.startBlocking();
                    }

                    vscode.window.showInformationMessage('Modo hiperfoco ativado!');
                } catch (error) {
                    console.error('Erro ao iniciar modo hiperfoco:', error);
                    vscode.window.showErrorMessage('Erro ao iniciar modo hiperfoco');
                }
            }),

            vscode.commands.registerCommand('tdah-dev-helper.stopFocus', async () => {
                try {
                    if (!hyperfocusManager) {
                        throw new Error('HyperfocusManager não inicializado');
                    }

                    await hyperfocusManager.deactivateHyperfocus();
                    
                    if (notificationBlocker) {
                        notificationBlocker.stopBlocking();
                    }

                    vscode.window.showInformationMessage('Modo hiperfoco desativado!');
                } catch (error) {
                    console.error('Erro ao parar modo hiperfoco:', error);
                    vscode.window.showErrorMessage('Erro ao parar modo hiperfoco');
                }
            }),

            // Comandos de Tarefas
            vscode.commands.registerCommand('tdah-dev-helper.showDashboard', async () => {
                try {
                    await taskTracker?.showTaskDetails();
                } catch (error) {
                    console.error('Erro ao mostrar dashboard:', error);
                    vscode.window.showErrorMessage('Erro ao mostrar dashboard. Por favor, tente novamente.');
                }
            }),
            vscode.commands.registerCommand('tdah-dev-helper.createTask', async () => {
                try {
                    await taskTracker?.createTask();
                } catch (error) {
                    console.error('Erro ao criar tarefa:', error);
                    vscode.window.showErrorMessage('Erro ao criar tarefa. Por favor, tente novamente.');
                }
            }),
            vscode.commands.registerCommand('tdah-dev-helper.decomposeTask', async () => {
                try {
                    await taskTracker?.decomposeCurrentTask();
                } catch (error) {
                    console.error('Erro ao decompor tarefa:', error);
                    vscode.window.showErrorMessage('Erro ao decompor tarefa. Por favor, tente novamente.');
                }
            }),

            // Comando para mostrar notificações bloqueadas (registrado apenas se notificationBlocker está inicializado)
            vscode.commands.registerCommand('tdah-dev-helper.showBlockedNotifications', async () => {
                if (notificationBlocker) {
                    notificationBlocker.showBlockedNotifications();
                }
            })
        ];

        // Adicionar disposables ao contexto
        context.subscriptions.push(...disposables);
    } catch (error) {
        console.error('Erro ao ativar a extensão:', error);
        vscode.window.showErrorMessage('Erro ao ativar a extensão. Por favor, tente novamente mais tarde.');
    }
}

export function deactivate() {
    if (taskTracker) {
        taskTracker.dispose();
    }
    if (apiClient) {
        apiClient.dispose();
    }
}