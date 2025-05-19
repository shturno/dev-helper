import * as vscode from 'vscode';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    subtasks: Subtask[];
}

export interface Subtask {
    id: number;
    taskId: number;
    title: string;
    estimatedMinutes: number;
    completed: boolean;
}

export class TaskTracker {
    private currentTask: Task | null = null;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private webviewPanel: vscode.WebviewPanel | null = null;
    private tasks: Task[] = [];

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'tdah-dev-helper.showTaskDetails';
        
        // Inicializar com algumas tarefas de exemplo
        this.tasks = [
            {
                id: 1,
                title: 'Implementar autenticação',
                description: 'Adicionar JWT e proteção de rotas',
                status: 'pending',
                subtasks: [
                    { id: 1, taskId: 1, title: 'Configurar JWT', estimatedMinutes: 30, completed: false },
                    { id: 2, taskId: 1, title: 'Implementar middleware de autenticação', estimatedMinutes: 45, completed: false },
                    { id: 3, taskId: 1, title: 'Testar endpoints protegidos', estimatedMinutes: 30, completed: false }
                ]
            },
            {
                id: 2,
                title: 'Corrigir bugs no frontend',
                description: 'Resolver problemas de layout e responsividade',
                status: 'pending',
                subtasks: [
                    { id: 4, taskId: 2, title: 'Corrigir layout em telas pequenas', estimatedMinutes: 30, completed: false },
                    { id: 5, taskId: 2, title: 'Ajustar componentes responsivos', estimatedMinutes: 45, completed: false }
                ]
            }
        ];
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
        this.updateStatusBar();
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
            // Filtrar apenas tarefas pendentes
            const pendingTasks = this.tasks.filter(t => t.status === 'pending');
            
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
                this.updateStatusBar();
                this.showTaskDetails();
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
        
        // Lidar com mensagens do webview
        this.webviewPanel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'selectTask':
                    await this.selectTask();
                    break;
                case 'decomposeTask':
                    await this.decomposeCurrentTask();
                    break;
                case 'startFocus':
                    await vscode.commands.executeCommand('tdah-dev-helper.startFocus');
                    break;
                case 'showProfile':
                    await vscode.commands.executeCommand('tdah-dev-helper.showProfile');
                    break;
                case 'showBlockedNotifications':
                    await vscode.commands.executeCommand('tdah-dev-helper.showBlockedNotifications');
                    break;
            }
        });

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = null;
        });
    }

    private async decomposeTask(task: Task): Promise<void> {
        try {
            vscode.window.showInformationMessage('Decompondo tarefa em subtarefas de 15 minutos...');
            
            // Simular decomposição de tarefa
            const newSubtasks = [
                { id: task.subtasks.length + 1, taskId: task.id, title: 'Análise inicial', estimatedMinutes: 15, completed: false },
                { id: task.subtasks.length + 2, taskId: task.id, title: 'Implementação', estimatedMinutes: 30, completed: false },
                { id: task.subtasks.length + 3, taskId: task.id, title: 'Testes', estimatedMinutes: 15, completed: false }
            ];
            
            task.subtasks.push(...newSubtasks);
            
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

        this.webviewPanel.webview.html = this.getTaskDetailsContent(this.currentTask);

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
        if (!this.currentTask) return;

        const subtask = this.currentTask.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
            subtask.completed = true;
            this.updateStatusBar();
            this.showTaskDetails();

            // Verificar se todas as subtarefas foram concluídas
            const allCompleted = this.currentTask.subtasks.every(s => s.completed);
            if (allCompleted) {
                this.currentTask.status = 'completed';
                vscode.window.showInformationMessage('Parabéns! Tarefa concluída! 🎉');
            }
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

    private getTaskDetailsContent(task: Task): string {
        const completedSubtasks = task.subtasks.filter(s => s.completed).length;
        const totalSubtasks = task.subtasks.length;
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
                    ${task.subtasks.map(subtask => `
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
                        line-height: 1.6;
                    }
                    .dashboard-container {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .dashboard-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    .dashboard-title {
                        font-size: 2em;
                        margin: 0;
                        color: var(--vscode-editor-foreground);
                    }
                    .dashboard-subtitle {
                        color: var(--vscode-descriptionForeground);
                        margin: 5px 0 0 0;
                    }
                    .dashboard-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .dashboard-card {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 8px;
                        padding: 20px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .card-title {
                        font-size: 1.2em;
                        margin: 0 0 15px 0;
                        color: var(--vscode-editor-foreground);
                    }
                    .action-button {
                        display: inline-block;
                        padding: 8px 16px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin: 5px;
                        text-decoration: none;
                        font-size: 0.9em;
                    }
                    .action-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .action-button.secondary {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .action-button.secondary:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 15px;
                        margin-top: 15px;
                    }
                    .stat-item {
                        text-align: center;
                        padding: 10px;
                        background-color: var(--vscode-editor-background);
                        border-radius: 4px;
                    }
                    .stat-value {
                        font-size: 1.5em;
                        font-weight: bold;
                        color: var(--vscode-editor-foreground);
                    }
                    .stat-label {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                    }
                    .task-list {
                        margin-top: 15px;
                    }
                    .task-item {
                        padding: 10px;
                        margin-bottom: 10px;
                        background-color: var(--vscode-editor-background);
                        border-radius: 4px;
                        border-left: 4px solid var(--vscode-button-background);
                    }
                    .task-item.completed {
                        border-left-color: var(--vscode-gitDecoration-addedResourceForeground);
                        opacity: 0.7;
                    }
                    .task-title {
                        font-weight: bold;
                        margin: 0 0 5px 0;
                    }
                    .task-description {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                        margin: 0;
                    }
                    .task-actions {
                        margin-top: 10px;
                        display: flex;
                        gap: 10px;
                    }
                    .task-actions button {
                        font-size: 0.8em;
                        padding: 4px 8px;
                    }
                </style>
            </head>
            <body>
                <div class="dashboard-container">
                    <div class="dashboard-header">
                        <div>
                            <h1 class="dashboard-title">TDAH Dev Helper</h1>
                            <p class="dashboard-subtitle">Seu assistente de produtividade</p>
                        </div>
                        <div>
                            <button class="action-button" onclick="startFocus()">
                                $(eye) Iniciar Modo Hiperfoco
                            </button>
                            <button class="action-button secondary" onclick="showProfile()">
                                $(account) Ver Perfil
                            </button>
                        </div>
                    </div>

                    <div class="dashboard-grid">
                        <div class="dashboard-card">
                            <h2 class="card-title">Ações Rápidas</h2>
                            <div>
                                <button class="action-button" onclick="selectTask()">
                                    $(tasklist) Selecionar Tarefa
                                </button>
                                <button class="action-button" onclick="decomposeTask()">
                                    $(split-horizontal) Decompor Tarefa
                                </button>
                                <button class="action-button" onclick="showBlockedNotifications()">
                                    $(bell) Ver Notificações
                                </button>
                            </div>
                        </div>

                        <div class="dashboard-card">
                            <h2 class="card-title">Estatísticas</h2>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <div class="stat-value">0</div>
                                    <div class="stat-label">Tarefas Hoje</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">0h</div>
                                    <div class="stat-label">Tempo Foco</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">0</div>
                                    <div class="stat-label">XP Ganho</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-card">
                        <h2 class="card-title">Tarefas Ativas</h2>
                        <div class="task-list">
                            <div class="task-item">
                                <h3 class="task-title">Nenhuma tarefa selecionada</h3>
                                <p class="task-description">Selecione uma tarefa para começar a trabalhar</p>
                                <div class="task-actions">
                                    <button class="action-button" onclick="selectTask()">
                                        Selecionar Tarefa
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    
                    function selectTask() {
                        vscode.postMessage({ command: 'selectTask' });
                    }
                    
                    function decomposeTask() {
                        vscode.postMessage({ command: 'decomposeTask' });
                    }
                    
                    function startFocus() {
                        vscode.postMessage({ command: 'startFocus' });
                    }
                    
                    function showProfile() {
                        vscode.postMessage({ command: 'showProfile' });
                    }
                    
                    function showBlockedNotifications() {
                        vscode.postMessage({ command: 'showBlockedNotifications' });
                    }

                    // Atualizar estatísticas periodicamente
                    setInterval(() => {
                        vscode.postMessage({ command: 'updateStats' });
                    }, 30000);

                    // Lidar com mensagens do VS Code
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateStats':
                                updateStatsDisplay(message.stats);
                                break;
                            case 'updateTasks':
                                updateTasksList(message.tasks);
                                break;
                        }
                    });

                    function updateStatsDisplay(stats) {
                        // Atualizar estatísticas quando receber dados
                    }

                    function updateTasksList(tasks) {
                        // Atualizar lista de tarefas quando receber dados
                    }
                </script>
            </body>
            </html>
        `;
    }
} 