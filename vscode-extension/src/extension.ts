import * as vscode from 'vscode';
import { ApiClient } from 'api/client';
import { ContextDetector } from 'context/detector';
import { HyperfocusManager } from 'hyperfocus/manager';
import { NotificationBlocker } from 'notifications/blocker';
import { TaskTracker } from 'tasks/tracker';

// Componentes globais para gerenciamento de estado
let apiClient: ApiClient;
let contextDetector: ContextDetector;
let hyperfocusManager: HyperfocusManager;
let notificationBlocker: NotificationBlocker;
let taskTracker: TaskTracker;

export async function activate(context: vscode.ExtensionContext) {
    console.log('TDAH Dev Helper está ativo!');

    try {
        // Inicializar cliente da API
        apiClient = new ApiClient();
        
        // Inicializar componentes principais
        contextDetector = new ContextDetector(apiClient);
        hyperfocusManager = HyperfocusManager.getInstance();
        notificationBlocker = new NotificationBlocker();
        taskTracker = new TaskTracker(apiClient);

        // Registrar comandos
        const disposables = [
            // Comandos de Hiperfoco
            vscode.commands.registerCommand('tdah-dev-helper.startFocus', async () => {
                try {
                    // Verificar se há uma tarefa ativa
                    const activeTask = await apiClient.getActiveTask();
                    if (!activeTask) {
                        const shouldSelectTask = await vscode.window.showWarningMessage(
                            'Nenhuma tarefa selecionada. Deseja selecionar uma tarefa antes de iniciar o modo hiperfoco?',
                            'Sim', 'Não'
                        );
                        
                        if (shouldSelectTask === 'Sim') {
                            await taskTracker.selectTask();
                            // Se ainda não houver tarefa selecionada, não ativar hiperfoco
                            if (!await apiClient.getActiveTask()) {
                                return;
                            }
                        }
                    }

                    await hyperfocusManager.activateHyperfocus({
                        reason: 'manual',
                        complexity: 0
                    });

                    // Iniciar bloqueio de notificações
                    notificationBlocker.startBlocking();
                } catch (error) {
                    console.error('Erro ao iniciar modo hiperfoco:', error);
                    vscode.window.showErrorMessage('Erro ao iniciar modo hiperfoco');
                }
            }),

            vscode.commands.registerCommand('tdah-dev-helper.stopFocus', async () => {
                try {
                    await hyperfocusManager.deactivateHyperfocus();
                    notificationBlocker.stopBlocking();
                } catch (error) {
                    console.error('Erro ao parar modo hiperfoco:', error);
                    vscode.window.showErrorMessage('Erro ao parar modo hiperfoco');
                }
            }),

            // Comandos de Tarefas
            vscode.commands.registerCommand('tdah-dev-helper.showDashboard', () => {
                taskTracker.showDashboard();
            }),

            vscode.commands.registerCommand('tdah-dev-helper.selectTask', async () => {
                try {
                    // Se estiver em modo hiperfoco, perguntar se deseja desativar
                    if (hyperfocusManager.isActive) {
                        const shouldStopFocus = await vscode.window.showWarningMessage(
                            'Você está em modo hiperfoco. Deseja desativá-lo para selecionar uma nova tarefa?',
                            'Sim', 'Não'
                        );
                        
                        if (shouldStopFocus === 'Sim') {
                            await hyperfocusManager.deactivateHyperfocus();
                            notificationBlocker.stopBlocking();
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
                try {
                    // Verificar se está em modo hiperfoco
                    if (hyperfocusManager.isActive) {
                        const shouldStopFocus = await vscode.window.showWarningMessage(
                            'Você está em modo hiperfoco. Deseja desativá-lo para decompor a tarefa?',
                            'Sim', 'Não'
                        );
                        
                        if (shouldStopFocus === 'Sim') {
                            await hyperfocusManager.deactivateHyperfocus();
                            notificationBlocker.stopBlocking();
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

            // Comando para mostrar notificações bloqueadas
            vscode.commands.registerCommand('tdah-dev-helper.showBlockedNotifications', () => {
                notificationBlocker.showBlockedNotifications();
            })
        ];

        // Adicionar disposables ao contexto
        context.subscriptions.push(...disposables);

        // Inicializar componentes
        await Promise.all([
            contextDetector.initialize(),
            hyperfocusManager.initialize(),
            notificationBlocker.initialize(),
            taskTracker.initialize()
        ]);

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

        console.log('TDAH Dev Helper foi desativado.');
    } catch (error) {
        console.error('Erro ao desativar TDAH Dev Helper:', error);
    }
} 