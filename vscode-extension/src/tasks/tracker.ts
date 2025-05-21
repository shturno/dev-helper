import * as vscode from 'vscode';
import { sanitizeHtml, isValidInput, sanitizeTask, sanitizeForWebview } from '../utils/security';
import { Task, Subtask, TaskValidation } from './types';

// Constantes de validação
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_SUBTASKS_PER_TASK = 20;
const MAX_ESTIMATED_MINUTES = 480;
const DEFAULT_XP_REWARD = 10;

// Enum para status das tarefas
export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed'
}

export class TaskTracker {
    private static instance: TaskTracker;
    private currentTask: Task | undefined;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private webviewPanel: vscode.WebviewPanel | null = null;
    private tasks: Task[] = [];

    private constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'tdah-dev-helper.selectTask';
        
        // Carregar tarefas salvas
        this.loadTasks();
        this.initialize();
    }

    public static getInstance(context?: vscode.ExtensionContext): TaskTracker {
        if (!TaskTracker.instance) {
            if (!context) {
                throw new Error('Context is required to initialize TaskTracker');
            }
            TaskTracker.instance = new TaskTracker(context);
        }
        return TaskTracker.instance;
    }

    private async loadTasks(): Promise<void> {
        try {
            const savedTasks = this.context.globalState.get<Task[]>('tdah-tasks', []);
            // Validar e sanitizar tarefas carregadas
            this.tasks = savedTasks.filter((task): task is Task => {
                if (!task || typeof task !== 'object') return false;
                const t = task as Task;
                return (
                    typeof t.id === 'number' &&
                    typeof t.title === 'string' &&
                    t.title.length > 0 &&
                    t.title.length <= MAX_TITLE_LENGTH &&
                    (!t.description || (typeof t.description === 'string' && t.description.length <= MAX_DESCRIPTION_LENGTH)) &&
                    Object.values(TaskStatus).includes(t.status) &&
                    typeof t.xpReward === 'number' &&
                    Array.isArray(t.subtasks) &&
                    t.subtasks.length <= MAX_SUBTASKS_PER_TASK &&
                    t.subtasks.every(this.isValidSubtask.bind(this)) &&
                    t.createdAt instanceof Date &&
                    t.updatedAt instanceof Date
                );
            });
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            vscode.window.showErrorMessage('Erro ao carregar tarefas salvas');
        }
    }

    private isValidSubtask(subtask: unknown): subtask is Subtask {
        if (!subtask || typeof subtask !== 'object') return false;
        const s = subtask as Subtask;
        return (
            typeof s.id === 'number' &&
            typeof s.taskId === 'number' &&
            typeof s.title === 'string' &&
            s.title.length > 0 &&
            typeof s.estimatedMinutes === 'number' &&
            s.estimatedMinutes >= 0 &&
            s.estimatedMinutes <= MAX_ESTIMATED_MINUTES &&
            typeof s.completed === 'boolean'
        );
    }

    private async saveTasks(): Promise<void> {
        try {
            // Sanitizar tarefas antes de salvar
            const tasksToSave = this.tasks.map(sanitizeTask);
            await this.context.globalState.update('tdah-tasks', tasksToSave);
        } catch (error) {
            console.error('Erro ao salvar tarefas:', error);
            vscode.window.showErrorMessage('Erro ao salvar tarefas');
        }
    }

    private validateTask(task: Task): TaskValidation {
        const errors: string[] = [];

        // Validar campos obrigatórios
        if (!task.title?.trim()) {
            errors.push('Título é obrigatório');
        } else if (task.title.length > MAX_TITLE_LENGTH) {
            errors.push(`Título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres`);
        }

        if (task.description && task.description.length > MAX_DESCRIPTION_LENGTH) {
            errors.push(`Descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`);
        }

        if (!Object.values(TaskStatus).includes(task.status)) {
            errors.push('Status inválido');
        }

        if (task.subtasks.length > MAX_SUBTASKS_PER_TASK) {
            errors.push(`Máximo de ${MAX_SUBTASKS_PER_TASK} subtarefas por tarefa`);
        }

        // Validar subtarefas
        task.subtasks.forEach((subtask, index) => {
            if (!subtask.title?.trim()) {
                errors.push(`Subtarefa ${index + 1}: título é obrigatório`);
            }
            if (subtask.estimatedMinutes < 0 || subtask.estimatedMinutes > MAX_ESTIMATED_MINUTES) {
                errors.push(`Subtarefa ${index + 1}: tempo estimado inválido`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public initialize(): void {
        // Registrar comando para selecionar tarefa
        this.disposables.push(
            vscode.commands.registerCommand(
                'tdah-dev-helper.selectTask',
                this.selectTask.bind(this)
            )
        );

        // Registrar comando para criar tarefa
        this.disposables.push(
            vscode.commands.registerCommand(
                'tdah-dev-helper.createTask',
                this.createTask.bind(this)
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

    private async selectTask(): Promise<Task | undefined> {
        try {
            const taskItems = this.tasks.map(task => ({
                label: task.title,
                description: task.description,
                task
            }));

            const selected = await vscode.window.showQuickPick(taskItems, {
                placeHolder: 'Selecione uma tarefa'
            });

            if (selected) {
                this.currentTask = selected.task;
                this.updateStatusBar();
                this.showTaskDetails();
                return selected.task;
            }
            return undefined;
        } catch (error) {
            console.error('Erro ao selecionar tarefa:', error);
            vscode.window.showErrorMessage('Erro ao selecionar tarefa');
            return undefined;
        }
    }

    public async decomposeCurrentTask(): Promise<void> {
        if (!this.currentTask) {
            vscode.window.showWarningMessage('Nenhuma tarefa selecionada');
            return;
        }

        await this.decomposeTask(this.currentTask.id);
    }

    public async createTask(): Promise<void> {
        try {
            // Solicitar título da tarefa
            const title = await vscode.window.showInputBox({
                prompt: 'Título da tarefa',
                placeHolder: 'Digite o título da tarefa',
                validateInput: (value) => {
                    if (!value) return 'O título é obrigatório';
                    if (!isValidInput(value)) return 'O título contém caracteres inválidos';
                    if (value.length > MAX_TITLE_LENGTH) return `O título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres`;
                    return null;
                }
            });

            if (!title) return;

            // Solicitar descrição (opcional)
            const description = await vscode.window.showInputBox({
                prompt: 'Descrição da tarefa (opcional)',
                placeHolder: 'Digite a descrição da tarefa',
                validateInput: (value) => {
                    if (value && !isValidInput(value)) return 'A descrição contém caracteres inválidos';
                    if (value && value.length > MAX_DESCRIPTION_LENGTH) return `A descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`;
                    return null;
                }
            });

            // Criar nova tarefa
            const newTask: Task = {
                id: Date.now(),
                title: sanitizeHtml(title),
                description: description ? sanitizeHtml(description) : '',
                status: TaskStatus.PENDING,
                xpReward: DEFAULT_XP_REWARD,
                subtasks: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Validar tarefa antes de adicionar
            const validation = this.validateTask(newTask);
            if (!validation.isValid) {
                vscode.window.showErrorMessage(`Erro ao criar tarefa: ${validation.errors.join(', ')}`);
                return;
            }

            this.tasks.push(newTask);
            await this.saveTasks();
            vscode.window.showInformationMessage(`Tarefa "${newTask.title}" criada com sucesso!`);

            // Perguntar se deseja decompor a tarefa
            const shouldDecompose = await vscode.window.showQuickPick(['Sim', 'Não'], {
                placeHolder: 'Deseja decompor esta tarefa em subtarefas?'
            });

            if (shouldDecompose === 'Sim') {
                await this.decomposeTask(newTask.id);
            }

            // Atualizar dashboard se estiver aberto
            this.updateDashboard();
        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            vscode.window.showErrorMessage('Erro ao criar tarefa');
        }
    }

    private async decomposeTask(taskId?: number): Promise<void> {
        try {
            // Se não foi fornecido um ID, selecionar a tarefa
            if (!taskId) {
                const selectedTask = await this.selectTask();
                if (!selectedTask) return;
                taskId = selectedTask.id;
            }

            const task = this.tasks.find(t => t.id === taskId);
            if (!task) {
                throw new Error('Tarefa não encontrada');
            }

            // Loop para adicionar múltiplas subtarefas
            while (true) {
                // Verificar limite de subtarefas
                if (task.subtasks.length >= MAX_SUBTASKS_PER_TASK) {
                    vscode.window.showWarningMessage(`Limite máximo de ${MAX_SUBTASKS_PER_TASK} subtarefas atingido`);
                    break;
                }

                // Perguntar se deseja adicionar mais uma subtarefa
                if (task.subtasks.length > 0) {
                    const shouldContinue = await vscode.window.showQuickPick(['Sim', 'Não'], {
                        placeHolder: 'Deseja adicionar mais uma subtarefa?'
                    });
                    if (shouldContinue !== 'Sim') {
                        break;
                    }
                }

                // Solicitar título da subtarefa
                const title = await vscode.window.showInputBox({
                    prompt: 'Título da subtarefa',
                    placeHolder: 'Digite o título da subtarefa',
                    validateInput: (value) => {
                        if (!value) return 'O título é obrigatório';
                        if (!isValidInput(value)) return 'O título contém caracteres inválidos';
                        if (value.length > MAX_TITLE_LENGTH) return `O título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres`;
                        return null;
                    }
                });

                if (!title) break;

                // Solicitar tempo estimado
                const estimatedMinutesStr = await vscode.window.showInputBox({
                    prompt: 'Tempo estimado (em minutos)',
                    placeHolder: 'Digite o tempo estimado em minutos',
                    validateInput: (value) => {
                        const minutes = parseInt(value);
                        if (isNaN(minutes)) return 'Digite um número válido';
                        if (minutes < 0) return 'O tempo deve ser positivo';
                        if (minutes > MAX_ESTIMATED_MINUTES) return `O tempo máximo é ${MAX_ESTIMATED_MINUTES} minutos`;
                        return null;
                    }
                });

                if (!estimatedMinutesStr) break;

                const estimatedMinutes = parseInt(estimatedMinutesStr);

                // Criar nova subtarefa
                const newSubtask: Subtask = {
                    id: Date.now(),
                    taskId: task.id,
                    title: sanitizeHtml(title),
                    estimatedMinutes,
                    completed: false
                };

                // Validar subtarefa antes de adicionar
                const validation = this.validateTask({ ...task, subtasks: [...task.subtasks, newSubtask] });
                if (!validation.isValid) {
                    vscode.window.showErrorMessage(`Erro ao adicionar subtarefa: ${validation.errors.join(', ')}`);
                    continue;
                }

                task.subtasks.push(newSubtask);
                task.updatedAt = new Date();
                await this.saveTasks();

                vscode.window.showInformationMessage('Subtarefa adicionada com sucesso!');
            }

            // Atualizar dashboard após adicionar todas as subtarefas
            this.updateDashboard();
        } catch (error) {
            console.error('Erro ao decompor tarefa:', error);
            vscode.window.showErrorMessage('Erro ao decompor tarefa');
        }
    }

    public async showTaskDetails(): Promise<void> {
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
                    await this.decomposeTask(this.currentTask!.id);
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
                this.currentTask.status = TaskStatus.COMPLETED;
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

    private updateDashboard(): void {
        if (this.webviewPanel) {
            this.webviewPanel.webview.postMessage({
                type: 'updateTasks',
                tasks: sanitizeForWebview(this.tasks)
            });
        }
    }

    public getTasks(): Task[] {
        return [...this.tasks];
    }
} 