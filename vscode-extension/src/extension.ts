import * as vscode from 'vscode';
import { ApiClient } from './api/client';
import { TaskTracker } from './tasks/tracker';
import { HyperfocusManager } from './hyperfocus/manager';
import { NotificationBlocker } from './notifications/blocker';
import { DashboardView } from './views/dashboard';
import { GamificationManager } from './gamification/manager';
import { TaskPriority } from './tasks/types';
import { Logger } from './utils/logger';
import { validateWebviewMessage } from './utils/security';
import { AnalysisManager } from './analysis/manager';

// Componentes globais para gerenciamento de estado
let apiClient: ApiClient | null = null;
let hyperfocusManager: HyperfocusManager | null = null;
let notificationBlocker: NotificationBlocker | null = null;
let taskTracker: TaskTracker | null = null;
let dashboardView: DashboardView | null = null;
let gamificationManager: GamificationManager | null = null;
let logger: Logger;

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
    try {
        // Inicializar logger
        logger = Logger.getInstance();
        logger.info('Iniciando ativação da extensão...');

        // Limpar o contexto anterior
        context.subscriptions.forEach(d => d.dispose());
        context.subscriptions.length = 0;

        logger.debug('Inicializando HyperfocusManager...');
        hyperfocusManager = HyperfocusManager.getInstance(context);
        await hyperfocusManager.initialize();
        logger.info('HyperfocusManager inicializado');

        logger.debug('Inicializando NotificationBlocker...');
        notificationBlocker = new NotificationBlocker(context);
        logger.info('NotificationBlocker inicializado');

        logger.debug('Inicializando TaskTracker...');
        taskTracker = TaskTracker.getInstance(context);
        logger.info('TaskTracker inicializado');

        logger.debug('Inicializando GamificationManager...');
        gamificationManager = GamificationManager.getInstance(context);
        await gamificationManager.initialize();
        logger.info('GamificationManager inicializado');

        // Inicializar o DashboardView
        if (hyperfocusManager && taskTracker) {
            logger.debug('Inicializando DashboardView...');
            const analysisManager = AnalysisManager.getInstance(context);
            dashboardView = DashboardView.getInstance(taskTracker, hyperfocusManager, analysisManager);
            logger.info('DashboardView inicializado');

            // Registrar o provider da view do dashboard
            context.subscriptions.push(
                vscode.window.registerWebviewViewProvider(
                    'dev-helper.dashboard',
                    dashboardView
                )
            );
        }

        // Inicializar componentes opcionais baseados na configuração
        const config = vscode.workspace.getConfiguration('devHelper');
        const apiUrl = config.get<string>('apiUrl');
        const debug = config.get<boolean>('debug');

        if (debug) {
            logger.debug('Modo debug ativado');
            logger.debug('API URL:', apiUrl || 'não configurada');
            logger.debug('Diretório de extensão:', context.extensionPath);
            logger.debug('Ambiente de desenvolvimento:', process.env.NODE_ENV);
        }

        if (apiUrl) {
            try {
                apiClient = new ApiClient(apiUrl);
                logger.info('API Client inicializado com sucesso');
            } catch (error) {
                logger.error('Erro ao inicializar API:', error as Error);
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
                    updateDashboard();
                    logger.info('Modo hiperfoco ativado manualmente');
                    vscode.window.showInformationMessage('Modo hiperfoco ativado!');
                } catch (error) {
                    logger.error('Erro ao iniciar modo hiperfoco:', error as Error);
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
                    updateDashboard();
                    logger.info('Modo hiperfoco desativado manualmente');
                    vscode.window.showInformationMessage('Modo hiperfoco desativado!');
                } catch (error) {
                    logger.error('Erro ao parar modo hiperfoco:', error as Error);
                    vscode.window.showErrorMessage('Erro ao parar modo hiperfoco');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.showDashboard, async () => {
                try {
                    await vscode.commands.executeCommand('dev-helper.dashboard.focus');
                    logger.debug('Dashboard aberto');
                } catch (error) {
                    logger.error('Erro ao mostrar dashboard:', error as Error);
                    vscode.window.showErrorMessage('Erro ao mostrar dashboard. Por favor, tente novamente.');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.createTask, async () => {
                try {
                    await taskTracker?.createTask();
                    updateDashboard();
                    logger.info('Nova tarefa criada');
                } catch (error) {
                    logger.error('Erro ao criar tarefa:', error as Error);
                    vscode.window.showErrorMessage('Erro ao criar tarefa. Por favor, tente novamente.');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.decomposeTask, async () => {
                try {
                    await taskTracker?.decomposeCurrentTask();
                    updateDashboard();
                    logger.info('Tarefa decomposta');
                } catch (error) {
                    logger.error('Erro ao decompor tarefa:', error as Error);
                    vscode.window.showErrorMessage('Erro ao decompor tarefa. Por favor, tente novamente.');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.showBlockedNotifications, async () => {
                if (notificationBlocker) {
                    notificationBlocker.showBlockedNotifications();
                    logger.debug('Notificações bloqueadas exibidas');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.moveTaskUp, async (taskId: number) => {
                try {
                    await taskTracker?.moveTaskUp(taskId);
                    updateDashboard();
                    logger.debug(`Tarefa ${taskId} movida para cima`);
                } catch (error) {
                    logger.error('Erro ao mover tarefa para cima:', error as Error);
                    vscode.window.showErrorMessage('Erro ao mover tarefa');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.moveTaskDown, async (taskId: number) => {
                try {
                    await taskTracker?.moveTaskDown(taskId);
                    updateDashboard();
                    logger.debug(`Tarefa ${taskId} movida para baixo`);
                } catch (error) {
                    logger.error('Erro ao mover tarefa para baixo:', error as Error);
                    vscode.window.showErrorMessage('Erro ao mover tarefa');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.setTaskPriority, async (taskId: number, priority: TaskPriority) => {
                try {
                    await taskTracker?.setTaskPriority(taskId, priority);
                    updateDashboard();
                    logger.debug(`Prioridade da tarefa ${taskId} alterada para ${priority}`);
                } catch (error) {
                    logger.error('Erro ao definir prioridade:', error as Error);
                    vscode.window.showErrorMessage('Erro ao definir prioridade da tarefa');
                }
            }),

            vscode.commands.registerCommand(COMMANDS.reorderTasks, async (taskIds: number[]) => {
                try {
                    const validatedMessage = validateWebviewMessage({ type: 'update', taskIds });
                    if (!validatedMessage) {
                        throw new Error('Dados de reordenação inválidos');
                    }
                    await taskTracker?.reorderTasks(taskIds);
                    updateDashboard();
                    logger.debug('Tarefas reordenadas:', taskIds);
                } catch (error) {
                    logger.error('Erro ao reordenar tarefas:', error as Error);
                    vscode.window.showErrorMessage('Erro ao reordenar tarefas');
                }
            })
        ];

        // Adicionar todos os disposables ao contexto
        disposables.forEach(d => context.subscriptions.push(d));

        // Adicionar um disposable para limpeza geral
        context.subscriptions.push({
            dispose: () => {
                logger.info('Desativando extensão...');
                if (taskTracker) {
                    taskTracker.dispose();
                }
                if (apiClient) {
                    apiClient.dispose();
                }
                if (dashboardView) {
                    dashboardView.dispose();
                }
                if (notificationBlocker) {
                    notificationBlocker.dispose();
                }
                if (gamificationManager) {
                    gamificationManager.dispose();
                }
                if (hyperfocusManager) {
                    hyperfocusManager.dispose();
                }
                if (logger) {
                    logger.dispose();
                }
                logger.info('Extensão desativada');
            }
        });

        logger.info('Extensão ativada com sucesso');
    } catch (error) {
        logger.error('Erro detalhado ao ativar a extensão:', error as Error);
        throw error;
    }
}

export function deactivate(): void {
    // A limpeza é feita através dos disposables no contexto
    logger?.info('Extensão desativada');
}

const updateDashboard = () => {
    if (dashboardView) {
        dashboardView.update();
    }
};