import * as vscode from 'vscode';
import { ApiClient } from './api/client';
import { TaskTracker } from './tasks/tracker';
import { HyperfocusManager } from './hyperfocus/manager';
import { NotificationBlocker } from './notifications/blocker';
import { DashboardView } from './views/dashboard';
import { GamificationManager } from './gamification/manager';
import { TaskPriority } from './tasks/types';

// Componentes globais para gerenciamento de estado
let apiClient: ApiClient | null = null;
let hyperfocusManager: HyperfocusManager | null = null;
let notificationBlocker: NotificationBlocker | null = null;
let taskTracker: TaskTracker | null = null;
let dashboardView: DashboardView | null = null;
let gamificationManager: GamificationManager | null = null;

// IDs dos comandos
const COMMANDS = {
    startFocus: 'dev-helper.startFocus',
    stopFocus: 'dev-helper.stopFocus',
    showDashboard: 'dev-helper.showDashboard',
    createTask: 'dev-helper.createTask',
    decomposeTask: 'dev-helper.decomposeTask',
    showBlockedNotifications: 'dev-helper.showBlockedNotifications',
    moveTaskUp: 'dev-helper.moveTaskUp',
    moveTaskDown: 'dev-helper.moveTaskDown',
    setTaskPriority: 'dev-helper.setTaskPriority',
    reorderTasks: 'dev-helper.reorderTasks'
};

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.warn('Dev Helper: Iniciando ativação...');

    try {
        // Limpar o contexto anterior
        context.subscriptions.forEach(d => d.dispose());
        context.subscriptions.length = 0;

        console.warn('Dev Helper: Inicializando HyperfocusManager...');
        hyperfocusManager = HyperfocusManager.getInstance();
        console.warn('Dev Helper: HyperfocusManager inicializado');

        console.warn('Dev Helper: Inicializando NotificationBlocker...');
        notificationBlocker = new NotificationBlocker();
        console.warn('Dev Helper: NotificationBlocker inicializado');

        console.warn('Dev Helper: Inicializando TaskTracker...');
        taskTracker = TaskTracker.getInstance(context);
        console.warn('Dev Helper: TaskTracker inicializado');

        console.warn('Dev Helper: Inicializando GamificationManager...');
        gamificationManager = GamificationManager.getInstance(context);
        await gamificationManager.initialize();
        console.warn('Dev Helper: GamificationManager inicializado');

        // Inicializar o DashboardView
        if (hyperfocusManager && taskTracker) {
            console.warn('Dev Helper: Inicializando DashboardView...');
            dashboardView = DashboardView.getInstance(context);
            console.warn('Dev Helper: DashboardView inicializado');
        }

        // Registrar o provider da view do dashboard
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                'dev-helper.dashboard',
                {
                    resolveWebviewView: (webviewView) => {
                        if (dashboardView) {
                            dashboardView.resolveWebviewView(
                                webviewView,
                                { state: {} },
                                new vscode.CancellationTokenSource().token
                            );
                        }
                    }
                }
            )
        );

        // Inicializar componentes opcionais baseados na configuração
        const config = vscode.workspace.getConfiguration('devHelper');
        const apiUrl = config.get<string>('apiUrl');
        const debug = config.get<boolean>('debug');

        if (debug) {
            console.warn('Dev Helper: Modo debug ativado');
            console.warn('Dev Helper: API URL:', apiUrl || 'não configurada');
            console.warn('Dev Helper: Diretório de extensão:', context.extensionPath);
            console.warn('Dev Helper: Ambiente de desenvolvimento:', process.env.NODE_ENV);
        }

        if (apiUrl) {
            try {
                apiClient = new ApiClient(apiUrl);
            } catch (error) {
                console.error('Dev Helper: Erro ao inicializar API:', error);
                vscode.window.showWarningMessage(
                    'Dev Helper: API não disponível. Algumas funcionalidades estarão limitadas.'
                );
            }
        }

        // Registrar comandos
        const disposables = [
            vscode.commands.registerCommand(COMMANDS.startFocus, async () => {
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
                    dashboardView?.update();
                    vscode.window.showInformationMessage('Modo hiperfoco ativado!');
                } catch (error) {
                    console.error('Erro ao iniciar modo hiperfoco:', error);
                    vscode.window.showErrorMessage('Erro ao iniciar modo hiperfoco');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.stopFocus, async () => {
                try {
                    if (!hyperfocusManager) {
                        throw new Error('HyperfocusManager não inicializado');
                    }
                    await hyperfocusManager.deactivateHyperfocus();
                    if (notificationBlocker) {
                        notificationBlocker.stopBlocking();
                    }
                    dashboardView?.update();
                    vscode.window.showInformationMessage('Modo hiperfoco desativado!');
                } catch (error) {
                    console.error('Erro ao parar modo hiperfoco:', error);
                    vscode.window.showErrorMessage('Erro ao parar modo hiperfoco');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.showDashboard, async () => {
                try {
                    await vscode.commands.executeCommand('dev-helper.dashboard.focus');
                } catch (error) {
                    console.error('Erro ao mostrar dashboard:', error);
                    vscode.window.showErrorMessage('Erro ao mostrar dashboard. Por favor, tente novamente.');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.createTask, async () => {
                try {
                    await taskTracker?.createTask();
                    dashboardView?.update();
                } catch (error) {
                    console.error('Erro ao criar tarefa:', error);
                    vscode.window.showErrorMessage('Erro ao criar tarefa. Por favor, tente novamente.');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.decomposeTask, async () => {
                try {
                    await taskTracker?.decomposeCurrentTask();
                    dashboardView?.update();
                } catch (error) {
                    console.error('Erro ao decompor tarefa:', error);
                    vscode.window.showErrorMessage('Erro ao decompor tarefa. Por favor, tente novamente.');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.showBlockedNotifications, async () => {
                if (notificationBlocker) {
                    notificationBlocker.showBlockedNotifications();
                }
            }),

            vscode.commands.registerCommand(COMMANDS.moveTaskUp, async (taskId: number) => {
                try {
                    await taskTracker?.moveTaskUp(taskId);
                    dashboardView?.update();
                } catch (error) {
                    console.error('Erro ao mover tarefa para cima:', error);
                    vscode.window.showErrorMessage('Erro ao mover tarefa');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.moveTaskDown, async (taskId: number) => {
                try {
                    await taskTracker?.moveTaskDown(taskId);
                    dashboardView?.update();
                } catch (error) {
                    console.error('Erro ao mover tarefa para baixo:', error);
                    vscode.window.showErrorMessage('Erro ao mover tarefa');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.setTaskPriority, async (taskId: number, priority: TaskPriority) => {
                try {
                    await taskTracker?.setTaskPriority(taskId, priority);
                    dashboardView?.update();
                } catch (error) {
                    console.error('Erro ao definir prioridade:', error);
                    vscode.window.showErrorMessage('Erro ao definir prioridade da tarefa');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.reorderTasks, async (taskIds: number[]) => {
                try {
                    await taskTracker?.reorderTasks(taskIds);
                    dashboardView?.update();
                } catch (error) {
                    console.error('Erro ao reordenar tarefas:', error);
                    vscode.window.showErrorMessage('Erro ao reordenar tarefas');
                }
            })
        ];

        // Adicionar todos os disposables ao contexto
        disposables.forEach(d => context.subscriptions.push(d));

        // Adicionar um disposable para limpeza geral
        context.subscriptions.push({
            dispose: () => {
                if (taskTracker) {
                    taskTracker.dispose();
                }
                if (apiClient) {
                    apiClient.dispose();
                }
                if (dashboardView) {
                    dashboardView.dispose();
                }
            }
        });

        console.warn('Dev Helper: Ativação concluída com sucesso');
    } catch (error) {
        console.error('Dev Helper: Erro detalhado ao ativar a extensão:', error);
        if (error instanceof Error) {
            console.error('Dev Helper: Stack trace:', error.stack);
        }
        throw error;
    }
}

export function deactivate(): void {
    // A limpeza é feita através dos disposables no contexto
}