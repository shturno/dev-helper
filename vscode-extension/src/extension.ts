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
        taskTracker = new TaskTracker();
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

            // Comandos de Tarefas (agora sempre disponíveis)
            vscode.commands.registerCommand('tdah-dev-helper.showDashboard', () => {
                console.log("TDAH Dev Helper: Comando 'tdah-dev-helper.showDashboard' chamado.");
                taskTracker?.showDashboard();
            }),
            vscode.commands.registerCommand('tdah-dev-helper.createTask', async () => {
                console.log("TDAH Dev Helper: Comando 'tdah-dev-helper.createTask' chamado.");
                try {
                    if (!taskTracker) {
                        throw new Error('TaskTracker não inicializado');
                    }

                    if (hyperfocusManager?.isActive) {
                        const shouldStopFocus = await vscode.window.showWarningMessage(
                            'Você está em modo hiperfoco. Deseja desativá-lo para criar uma nova tarefa?',
                            'Sim', 'Não'
                        );
                        
                        if (shouldStopFocus === 'Sim') {
                            await hyperfocusManager.deactivateHyperfocus();
                            notificationBlocker?.stopBlocking();
                        } else {
                            return;
                        }
                    }

                    await taskTracker.createTask();
                } catch (error) {
                    console.error('Erro ao criar tarefa:', error);
                    vscode.window.showErrorMessage('Erro ao criar tarefa');
                }
            }),
            vscode.commands.registerCommand('tdah-dev-helper.selectTask', async () => {
                console.log("TDAH Dev Helper: Comando 'tdah-dev-helper.selectTask' chamado.");
                try {
                    if (!taskTracker) {
                        throw new Error('TaskTracker não inicializado');
                    }

                    if (hyperfocusManager?.isActive) {
                        const shouldStopFocus = await vscode.window.showWarningMessage(
                            'Você está em modo hiperfoco. Deseja desativá-lo para selecionar uma nova tarefa?',
                            'Sim', 'Não'
                        );
                        
                        if (shouldStopFocus === 'Sim') {
                            await hyperfocusManager.deactivateHyperfocus();
                            notificationBlocker?.stopBlocking();
                        } else {
                            return;
                        }
                    }

                    await taskTracker.selectTask();
                } catch (error) {
                    console.error('Erro ao selecionar tarefa:', error);
                    vscode.window.showErrorMessage('Erro ao selecionar tarefa');
                }
            }),
            vscode.commands.registerCommand('tdah-dev-helper.decomposeTask', async () => {
                console.log("TDAH Dev Helper: Comando 'tdah-dev-helper.decomposeTask' chamado.");
                try {
                    if (!taskTracker) {
                        throw new Error('TaskTracker não inicializado');
                    }

                    if (hyperfocusManager?.isActive) {
                        const shouldStopFocus = await vscode.window.showWarningMessage(
                            'Você está em modo hiperfoco. Deseja desativá-lo para decompor a tarefa?',
                            'Sim', 'Não'
                        );
                        
                        if (shouldStopFocus === 'Sim') {
                            await hyperfocusManager.deactivateHyperfocus();
                            notificationBlocker?.stopBlocking();
                        } else {
                            return;
                        }
                    }

                    await taskTracker.decomposeCurrentTask();
                } catch (error) {
                    console.error('Erro ao decompor tarefa:', error);
                    vscode.window.showErrorMessage('Erro ao decompor tarefa');
                }
            }),

            // Comando para mostrar notificações bloqueadas (registrado apenas se notificationBlocker estiver ativo)
            ...(notificationBlocker ? [
                vscode.commands.registerCommand('tdah-dev-helper.showBlockedNotifications', () => {
                    notificationBlocker?.showBlockedNotifications();
                })
            ] : []),

            // Comando para mostrar perfil (agora sempre disponível)
            vscode.commands.registerCommand('tdah-dev-helper.showProfile', () => {
                gamificationManager?.showProfile();
            })
        ];

        // Adicionar disposables ao contexto
        context.subscriptions.push(...disposables);

        // Inicializar componentes
        await Promise.all([
            contextDetector?.initialize(),
            hyperfocusManager.initialize(),
            taskTracker.initialize(),
            gamificationManager.initialize(),
            themeManager.initialize()
        ].filter(Boolean));

        // Mostrar mensagem de boas-vindas
        vscode.window.showInformationMessage(
            'TDAH Dev Helper ativado! Use Ctrl+Shift+P e digite "TDAH" para ver os comandos disponíveis.'
        );

    } catch (error) {
        console.error('Erro ao inicializar TDAH Dev Helper:', error);
        vscode.window.showErrorMessage(
            'Erro ao inicializar TDAH Dev Helper. Verifique o console para mais detalhes.'
        );
    }
}

export async function deactivate() {
    try {
        // Desativar modo hiperfoco se estiver ativo
        if (hyperfocusManager?.isActive) {
            await hyperfocusManager.deactivateHyperfocus();
            notificationBlocker?.stopBlocking();
        }

        // Limpar recursos
        contextDetector?.dispose();
        hyperfocusManager?.dispose();
        notificationBlocker?.dispose();
        taskTracker?.dispose();
        gamificationManager?.dispose();
        themeManager?.dispose();

        console.log('TDAH Dev Helper foi desativado.');
    } catch (error) {
        console.error('Erro ao desativar TDAH Dev Helper:', error);
    }
} 