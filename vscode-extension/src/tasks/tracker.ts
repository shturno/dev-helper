import * as vscode from 'vscode';
import { ApiClient, Task, Subtask } from '../api/client';

export class TaskTracker {
    private apiClient: ApiClient;
    private currentTask: Task | null = null;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private webviewPanel: vscode.WebviewPanel | null = null;

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'tdah-dev-helper.showTaskDetails';
    }

    public initialize(): void {
        // Registrar comando para selecionar tarefa
        this.disposables.push(
            vscode.commands.registerCommand(
                'tdah-dev-helper.selectTask',
                this.selectTask.bind(this)
            )
        );

        // Registrar comando para mostrar detalhes da tarefa
        this.disposables.push(
            vscode.commands.registerCommand(
                'tdah-dev-helper.showTaskDetails',
                this.showTaskDetails.bind(this)
            )
        );

        // Registrar comando para decompor tarefa
        this.disposables.push(
            vscode.commands.registerCommand(
                'tdah-dev-helper.decomposeTask',
                this.decomposeCurrentTask.bind(this)
            )
        );

        // Exibir status bar
        this.statusBarItem.show();

        // Verificar se há uma tarefa ativa
        this.loadActiveTask();
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }

    public async selectTask(): Promise<void> {
        try {
            // Obter lista de tarefas
            const tasks = await this.apiClient.getUserTasks();
            
            // Filtrar apenas tarefas pendentes
            const pendingTasks = tasks.filter(t => t.status === 'pending');
            
            if (pendingTasks.length === 0) {
                vscode.window.showInformationMessage('Não há tarefas pendentes');
                return;
            }

            // Mostrar quick pick para seleção
            const selected = await vscode.window.showQuickPick(
                pendingTasks.map(task => ({
                    label: task.title,
                    description: `${task.subtasks.length} subtarefas`,
                    task
                })),
                {
                    placeHolder: 'Selecione uma tarefa para trabalhar'
                }
            );

            if (selected) {
                this.currentTask = selected.task;
                
                // Verificar se a tarefa já tem subtarefas
                let subtasks = await this.apiClient.getSubtasks(this.currentTask.id);
                
                // Se não tiver subtarefas, oferecer decomposição
                if (subtasks.length === 0) {
                    const shouldDecompose = await vscode.window.showInformationMessage(
                        'Esta tarefa não possui subtarefas. Deseja decompô-la em passos de 15 minutos?',
                        'Sim', 'Não'
                    );
                    
                    if (shouldDecompose === 'Sim') {
                        await this.decomposeTask(this.currentTask);
                        subtasks = await this.apiClient.getSubtasks(this.currentTask.id);
                    }
                }

                // Atualizar visualização
                this.updateStatusBar();
                this.showTaskDetails();

                // Notificar backend sobre tarefa ativa
                await this.apiClient.setActiveTask(this.currentTask.id);
            }
        } catch (error) {
            console.error('Erro ao selecionar tarefa:', error);
            vscode.window.showErrorMessage('Erro ao carregar tarefas');
        }
    }

    public async decomposeCurrentTask(): Promise<void> {
        if (!this.currentTask) {
            vscode.window.showWarningMessage('Nenhuma tarefa selecionada');
            return;
        }

        await this.decomposeTask(this.currentTask);
    }

    public showDashboard(): void {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            'tdahDashboard',
            'TDAH Dev Helper - Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.webviewPanel.webview.html = this.getDashboardContent();
        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = null;
        });
    }

    private async loadActiveTask(): Promise<void> {
        try {
            const activeTask = await this.apiClient.getActiveTask();
            if (activeTask) {
                this.currentTask = activeTask;
                this.updateStatusBar();
            }
        } catch (error) {
            console.error('Erro ao carregar tarefa ativa:', error);
        }
    }

    private async decomposeTask(task: Task): Promise<void> {
        try {
            vscode.window.showInformationMessage('Decompondo tarefa em subtarefas de 15 minutos...');
            
            await this.apiClient.decomposeTask(task.id);
            
            vscode.window.showInformationMessage('Tarefa decomposta com sucesso!');
            
            // Atualizar visualização
            this.showTaskDetails();
        } catch (error) {
            console.error('Erro ao decompor tarefa:', error);
            vscode.window.showErrorMessage('Erro ao decompor tarefa');
        }
    }

    private async showTaskDetails(): Promise<void> {
        if (!this.currentTask) {
            vscode.window.showWarningMessage('Nenhuma tarefa selecionada');
            return;
        }

        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            'taskDetails',
            `Tarefa: ${this.currentTask.title}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        const subtasks = await this.apiClient.getSubtasks(this.currentTask.id);
        this.webviewPanel.webview.html = this.getTaskDetailsContent(this.currentTask, subtasks);

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = null;
        });

        // Lidar com mensagens do webview
        this.webviewPanel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'completeSubtask':
                    await this.completeSubtask(message.subtaskId);
                    break;
                case 'decomposeTask':
                    await this.decomposeTask(this.currentTask!);
                    break;
            }
        });
    }

    private async completeSubtask(subtaskId: number): Promise<void> {
        try {
            const result = await this.apiClient.completeSubtask(subtaskId);
            
            // Mostrar notificação de XP ganho
            vscode.window.showInformationMessage(
                `Subtarefa concluída! +${result.xp_earned} XP`
            );

            // Se todas as subtarefas foram concluídas
            if (result.all_completed) {
                vscode.window.showInformationMessage(
                    `Tarefa concluída! Total de XP: ${this.currentTask?.xpReward}`
                );
                this.currentTask = null;
                this.updateStatusBar();
            }

            // Atualizar visualização
            this.showTaskDetails();
        } catch (error) {
            console.error('Erro ao completar subtarefa:', error);
            vscode.window.showErrorMessage('Erro ao completar subtarefa');
        }
    }

    private updateStatusBar(): void {
        if (!this.currentTask) {
            this.statusBarItem.text = '$(tasklist) Nenhuma tarefa selecionada';
            this.statusBarItem.tooltip = 'Clique para selecionar uma tarefa';
            return;
        }

        const completedSubtasks = this.currentTask.subtasks.filter(s => s.completed).length;
        const totalSubtasks = this.currentTask.subtasks.length;
        const progress = totalSubtasks > 0 
            ? Math.round((completedSubtasks / totalSubtasks) * 100) 
            : 0;

        this.statusBarItem.text = `$(tasklist) ${this.currentTask.title} (${progress}%)`;
        this.statusBarItem.tooltip = `${completedSubtasks}/${totalSubtasks} subtarefas concluídas`;
    }

    private getTaskDetailsContent(task: Task, subtasks: Subtask[]): string {
        const completedSubtasks = subtasks.filter(s => s.completed).length;
        const totalSubtasks = subtasks.length;
        const progress = totalSubtasks > 0 
            ? Math.round((completedSubtasks / totalSubtasks) * 100) 
            : 0;

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
                    .task-header {
                        margin-bottom: 20px;
                    }
                    .task-title {
                        font-size: 1.5em;
                        margin-bottom: 10px;
                    }
                    .task-description {
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 20px;
                    }
                    .hp-bar-container {
                        width: 100%;
                        height: 20px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 10px;
                        overflow: hidden;
                        margin-bottom: 20px;
                    }
                    .hp-bar {
                        height: 100%;
                        background-color: var(--vscode-progressBar-background);
                        transition: width 0.3s ease;
                    }
                    .subtask-list {
                        list-style: none;
                        padding: 0;
                    }
                    .subtask-item {
                        display: flex;
                        align-items: center;
                        padding: 10px;
                        margin-bottom: 10px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                    }
                    .subtask-checkbox {
                        margin-right: 10px;
                    }
                    .subtask-info {
                        flex-grow: 1;
                    }
                    .subtask-title {
                        margin: 0;
                    }
                    .subtask-time {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                    }
                    .subtask-completed {
                        text-decoration: line-through;
                        opacity: 0.7;
                    }
                    .action-buttons {
                        margin-top: 20px;
                    }
                    .action-button {
                        padding: 8px 16px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 10px;
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="task-header">
                    <h1 class="task-title">${task.title}</h1>
                    <p class="task-description">${task.description}</p>
                    <div class="hp-bar-container">
                        <div class="hp-bar" style="width: ${100 - progress}%"></div>
                    </div>
                    <div>Progresso: ${progress}% (${completedSubtasks}/${totalSubtasks} subtarefas)</div>
                </div>

                <h2>Subtarefas</h2>
                <ul class="subtask-list">
                    ${subtasks.map(subtask => `
                        <li class="subtask-item">
                            <input type="checkbox" 
                                   class="subtask-checkbox" 
                                   ${subtask.completed ? 'checked' : ''}
                                   ${subtask.completed ? 'disabled' : ''}
                                   onchange="completeSubtask(${subtask.id})">
                            <div class="subtask-info ${subtask.completed ? 'subtask-completed' : ''}">
                                <h3 class="subtask-title">${subtask.title}</h3>
                                <div class="subtask-time">${subtask.estimatedMinutes} minutos</div>
                            </div>
                        </li>
                    `).join('')}
                </ul>

                <div class="action-buttons">
                    <button class="action-button" onclick="decomposeTask()">
                        Decompor Tarefa
                    </button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function completeSubtask(subtaskId) {
                        vscode.postMessage({
                            command: 'completeSubtask',
                            subtaskId: subtaskId
                        });
                    }
                    
                    function decomposeTask() {
                        vscode.postMessage({
                            command: 'decomposeTask'
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }

    private getDashboardContent(): string {
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
                    .dashboard-header {
                        margin-bottom: 30px;
                    }
                    .dashboard-title {
                        font-size: 2em;
                        margin-bottom: 10px;
                    }
                    .dashboard-section {
                        margin-bottom: 30px;
                    }
                    .section-title {
                        font-size: 1.5em;
                        margin-bottom: 15px;
                    }
                    .action-button {
                        padding: 8px 16px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 10px;
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="dashboard-header">
                    <h1 class="dashboard-title">TDAH Dev Helper</h1>
                    <p>Seu assistente de produtividade</p>
                </div>

                <div class="dashboard-section">
                    <h2 class="section-title">Ações Rápidas</h2>
                    <button class="action-button" onclick="selectTask()">
                        Selecionar Tarefa
                    </button>
                    <button class="action-button" onclick="startFocus()">
                        Iniciar Modo Hiperfoco
                    </button>
                    <button class="action-button" onclick="showTaskDetails()">
                        Ver Tarefa Atual
                    </button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function selectTask() {
                        vscode.postMessage({ command: 'selectTask' });
                    }
                    
                    function startFocus() {
                        vscode.postMessage({ command: 'startFocus' });
                    }
                    
                    function showTaskDetails() {
                        vscode.postMessage({ command: 'showTaskDetails' });
                    }
                </script>
            </body>
            </html>
        `;
    }
} 