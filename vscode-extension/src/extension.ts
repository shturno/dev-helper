import * as vscode from 'vscode';
import { ApiClient } from './api/client';
import { TaskTracker } from './tasks/tracker';
import { HyperfocusManager } from './hyperfocus/manager';
import { NotificationBlocker } from './notifications/blocker';
import { DashboardView } from './views/dashboard';
import { GamificationManager } from './gamification/manager';
import { Logger } from './utils/logger';
import { AnalysisManager } from './analysis/manager';

// Componentes globais para gerenciamento de estado
let apiClient: ApiClient | null = null;
let hyperfocusManager: HyperfocusManager | null = null;
let notificationBlocker: NotificationBlocker | null = null;
let taskTracker: TaskTracker | null = null;
let dashboardView: vscode.WebviewViewProvider | null = null;
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
    reorderTasks: 'dev-helper.reorderTasks',
    // Comandos de tags e categorias
    createTag: 'dev-helper.createTag',
    editTag: 'dev-helper.editTag',
    deleteTag: 'dev-helper.deleteTag',
    createCategory: 'dev-helper.createCategory',
    editCategory: 'dev-helper.editCategory',
    deleteCategory: 'dev-helper.deleteCategory',
    manageTags: 'dev-helper.manageTags',
    manageCategories: 'dev-helper.manageCategories',
    addTagToTask: 'dev-helper.addTagToTask',
    setTaskCategory: 'dev-helper.setTaskCategory'
};

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    try {
        // Inicializar componentes
        apiClient = new ApiClient();
        hyperfocusManager = HyperfocusManager.getInstance(context);
        notificationBlocker = new NotificationBlocker(context);
        taskTracker = TaskTracker.getInstance(context);
        gamificationManager = GamificationManager.getInstance(context);
        logger = Logger.getInstance();

        // Registrar provider do dashboard
        const dashboardProvider = new DashboardView(taskTracker, hyperfocusManager, AnalysisManager.getInstance(context), context);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('dev-helper.dashboard', dashboardProvider)
        );
        dashboardView = dashboardProvider;

        logger.info('Iniciando ativação da extensão...');

        logger.debug('Inicializando HyperfocusManager...');
        await hyperfocusManager.initialize();
        logger.info('HyperfocusManager inicializado');

        logger.debug('Inicializando NotificationBlocker...');
        await notificationBlocker.initialize();
        logger.info('NotificationBlocker inicializado');

        logger.info('TaskTracker inicializado');

        logger.debug('Inicializando GamificationManager...');
        await gamificationManager.initialize();
        logger.info('GamificationManager inicializado');

        // Registrar comandos de TaskTracker via seu inicializador
        logger.debug('Inicializando TaskTracker...');
        taskTracker?.initialize();
        logger.info('TaskTracker comandos registrados');

        // Commands for starting focus and showing dashboard only
        const disposables = [
            vscode.commands.registerCommand(COMMANDS.startFocus, async () => {
                try {
                    if (!hyperfocusManager) {
                        throw new Error('HyperfocusManager não inicializado');
                    }
                    await hyperfocusManager.activateHyperfocus({ reason: 'manual', complexity: 0 });
                    notificationBlocker?.startBlocking();
                    updateDashboard();
                    logger.info('Modo hiperfoco ativado manualmente');
                    vscode.window.showInformationMessage('Modo hiperfoco ativado!');
                } catch (error) {
                    logger.error('Erro ao iniciar modo hiperfoco:', error as Error);
                    vscode.window.showErrorMessage('Erro ao iniciar modo hiperfoco');
                }
            }),
            vscode.commands.registerCommand(COMMANDS.showDashboard, async () => {
                try {
                    await vscode.commands.executeCommand('workbench.view.extension.dev-helper-sidebar');
                    await vscode.commands.executeCommand('dev-helper.dashboard.focus');
                    logger.debug('Dashboard aberto');
                } catch (error) {
                    logger.error('Erro ao mostrar dashboard:', error as Error);
                    vscode.window.showErrorMessage('Erro ao mostrar dashboard. Por favor, tente novamente.');
                }
            })
        ];

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
                    (dashboardView as DashboardView).dispose();
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
        (dashboardView as DashboardView).update();
    }
};