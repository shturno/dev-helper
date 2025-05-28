import * as vscode from 'vscode';
import { sanitizeHtml, isValidInput, sanitizeTask } from '../utils/security';
import { Task, TaskStatus, TaskPriority, TaskValidation, Subtask, PriorityCriteria } from './types';
import { GamificationManager, UserData } from '../gamification/manager';
import { PriorityManager } from './priority-manager';
import { PrioritySuggestionManager } from './priority-suggestions';
import { TagManager } from './tag-manager';

// Constantes de validação
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_SUBTASKS_PER_TASK = 20;
const MAX_ESTIMATED_MINUTES = 480;
const DEFAULT_XP_REWARD = 10;

export class TaskTracker {
    private static instance: TaskTracker;
    private currentTask: Task | undefined;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private webviewPanel: vscode.WebviewPanel | null = null;
    private tasks: Task[] = [];
    private gamificationManager: GamificationManager | null = null;
    private priorityManager: PriorityManager;
    private prioritySuggestionManager: PrioritySuggestionManager;
    private tagManager: TagManager;
    private urgentTaskCheckInterval: NodeJS.Timeout | null = null;

    private constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'dev-helper.selectTask';
        
        // Inicializar gerenciadores
        this.priorityManager = PriorityManager.getInstance();
        this.prioritySuggestionManager = PrioritySuggestionManager.getInstance();
        this.tagManager = TagManager.getInstance(context);
        
        // Carregar tarefas salvas
        this.loadTasks().catch(error => {
            console.error('Erro ao carregar tarefas iniciais:', error);
            vscode.window.showErrorMessage('Erro ao carregar tarefas salvas. Algumas funcionalidades podem estar limitadas.');
        });
        
        this.initialize();
        this.startUrgentTaskChecker();
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
            let savedTasks = this.context.globalState.get<Task[]>('tdah-tasks', []);
            if (!Array.isArray(savedTasks)) {
                console.warn('Dados de tarefas inválidos encontrados, inicializando com array vazio');
                savedTasks = [];
                await this.context.globalState.update('tdah-tasks', []);
            }
            
            // Converter datas de string para Date e validar dados
            const reviveDates = (task: any): Task | null => {
                try {
                    if (!task || typeof task !== 'object') {
                        console.warn('Tarefa inválida encontrada:', task);
                        return null;
                    }

                    const revivedTask = {
                        ...task,
                        createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                        updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
                        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
                        subtasks: Array.isArray(task.subtasks) ? task.subtasks.map((sub: any) => ({
                            ...sub,
                            startedAt: sub.startedAt ? new Date(sub.startedAt) : undefined,
                            completedAt: sub.completedAt ? new Date(sub.completedAt) : undefined
                        })) : [],
                        priorityCriteria: {
                            ...task.priorityCriteria,
                            deadline: task.priorityCriteria?.deadline ? new Date(task.priorityCriteria.deadline) : undefined
                        }
                    };

                    // Validar campos obrigatórios
                    if (!this.isValidTask(revivedTask)) {
                        console.warn('Tarefa com dados inválidos encontrada:', revivedTask);
                        return null;
                    }

                    return revivedTask;
                } catch (error) {
                    console.error('Erro ao reviver tarefa:', error);
                    return null;
                }
            };

            // Processar e validar todas as tarefas
            const validTasks = savedTasks
                .map(reviveDates)
                .filter((task): task is Task => task !== null);

            if (validTasks.length !== savedTasks.length) {
                console.warn(`Foram encontradas ${savedTasks.length - validTasks.length} tarefas inválidas`);
                // Salvar versão sanitizada imediatamente
                await this.context.globalState.update('tdah-tasks', validTasks);
            }

            this.tasks = validTasks;
            
            // Verificar e corrigir IDs duplicados
            const taskIds = new Set<number>();
            this.tasks = this.tasks.map(task => {
                if (taskIds.has(task.id)) {
                    const newId = Date.now() + Math.floor(Math.random() * 1000);
                    taskIds.add(newId);
                    return { ...task, id: newId };
                }
                taskIds.add(task.id);
                return task;
            });

            // Salvar versão final sanitizada
            await this.saveTasks();
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            vscode.window.showErrorMessage('Erro ao carregar tarefas salvas');
            this.tasks = []; // Inicializar com array vazio em caso de erro
            await this.context.globalState.update('tdah-tasks', []);
        }
    }

    private isValidTask(task: any): task is Task {
        return (
            typeof task === 'object' &&
            task !== null &&
            typeof task.id === 'number' &&
            typeof task.title === 'string' &&
            task.title.length > 0 &&
            task.title.length <= MAX_TITLE_LENGTH &&
            (!task.description || (typeof task.description === 'string' && task.description.length <= MAX_DESCRIPTION_LENGTH)) &&
            Object.values(TaskStatus).includes(task.status) &&
            typeof task.xpReward === 'number' &&
            Array.isArray(task.subtasks) &&
            task.subtasks.length <= MAX_SUBTASKS_PER_TASK &&
            task.subtasks.every(this.isValidSubtask.bind(this)) &&
            task.createdAt instanceof Date &&
            task.updatedAt instanceof Date &&
            (!task.completedAt || task.completedAt instanceof Date) &&
            typeof task.priorityCriteria === 'object' &&
            task.priorityCriteria !== null &&
            typeof task.priorityCriteria.complexity === 'number' &&
            typeof task.priorityCriteria.impact === 'number' &&
            typeof task.priorityCriteria.estimatedTime === 'number' &&
            (!task.priorityCriteria.deadline || task.priorityCriteria.deadline instanceof Date)
        );
    }

    private isValidSubtask(subtask: unknown): subtask is Subtask {
        if (!subtask || typeof subtask !== 'object') return false;
        const s = subtask as Subtask;
        return (
            typeof s.id === 'number' &&
            typeof s.title === 'string' &&
            s.title.length > 0 &&
            typeof s.estimatedMinutes === 'number' &&
            s.estimatedMinutes >= 0 &&
            s.estimatedMinutes <= MAX_ESTIMATED_MINUTES &&
            Object.values(TaskStatus).includes(s.status)
        );
    }

    private async saveTasks(): Promise<void> {
        try {
            // Sanitizar e validar tarefas antes de salvar
            const tasksToSave = this.tasks
                .map(sanitizeTask)
                .filter(this.isValidTask.bind(this));

            // Verificar se houve alterações antes de salvar
            const currentSavedTasks = this.context.globalState.get<Task[]>('tdah-tasks', []);
            if (JSON.stringify(currentSavedTasks) !== JSON.stringify(tasksToSave)) {
            await this.context.globalState.update('tdah-tasks', tasksToSave);
                console.log('Tarefas salvas com sucesso');
            }
        } catch (error) {
            console.error('Erro ao salvar tarefas:', error);
            vscode.window.showErrorMessage('Erro ao salvar tarefas');
            throw error; // Propagar erro para tratamento adequado
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
        // Registrar comando para selecionar tarefa - com proteção contra registro duplicado
        try {
            this.disposables.push(
                vscode.commands.registerCommand(
                    'dev-helper.selectTask',
                    this.selectTask.bind(this)
                )
            );
        } catch (error) {
            // Se o comando já existe, apenas log e continua
            if (error instanceof Error) {
                console.log(`Comando dev-helper.selectTask já registrado, ignorando: ${error.message}`);
            } else {
                console.log("Comando dev-helper.selectTask já registrado, ignorando.");
            }
        }

        // Registrar comando para criar tarefa - com proteção contra registro duplicado
        try {
            this.disposables.push(
                vscode.commands.registerCommand(
                    'dev-helper.createTask',
                    this.createTask.bind(this)
                )
            );
        } catch (error) {
            if (error instanceof Error) {
                console.log(`Comando dev-helper.createTask já registrado, ignorando: ${error.message}`);
            } else {
                console.log("Comando dev-helper.createTask já registrado, ignorando.");
            }
        }

        // Registrar comando para mostrar detalhes da tarefa - com proteção contra registro duplicado
        try {
            this.disposables.push(
                vscode.commands.registerCommand(
                    'dev-helper.showTaskDetails',
                    this.showTaskDetails.bind(this)
                )
            );
        } catch (error) {
            if (error instanceof Error) {
                console.log(`Comando dev-helper.showTaskDetails já registrado, ignorando: ${error.message}`);
            } else {
                console.log("Comando dev-helper.showTaskDetails já registrado, ignorando.");
            }
        }

        // Registrar comando para decompor tarefa - com proteção contra registro duplicado
        try {
            this.disposables.push(
                vscode.commands.registerCommand(
                    'dev-helper.decomposeTask',
                    this.decomposeCurrentTask.bind(this)
                )
            );
        } catch (error) {
            if (error instanceof Error) {
                console.log(`Comando dev-helper.decomposeTask já registrado, ignorando: ${error.message}`);
            } else {
                console.log("Comando dev-helper.decomposeTask já registrado, ignorando.");
            }
        }

        // Registrar comando para adicionar tag à tarefa - com proteção contra registro duplicado
        try {
            this.disposables.push(
                vscode.commands.registerCommand('dev-helper.addTagToTask', async (task: Task) => {
                    const tags = this.tagManager.getTags();
                    const selectedTags = await vscode.window.showQuickPick(
                        tags.map(t => ({ label: t.name, value: t })),
                        {
                            placeHolder: 'Selecione as tags para adicionar',
                            canPickMany: true
                        }
                    );

                    if (selectedTags) {
                        task.tags = selectedTags.map(t => t.value);
                        await this.saveTasks();
                        this.showTaskDetails();
                    }
                })
            );
        } catch (error) {
            if (error instanceof Error) {
                console.log(`Comando dev-helper.addTagToTask já registrado, ignorando: ${error.message}`);
            } else {
                console.log("Comando dev-helper.addTagToTask já registrado, ignorando.");
            }
        }

        // Registrar comando para definir categoria da tarefa - com proteção contra registro duplicado
        try {
            this.disposables.push(
                vscode.commands.registerCommand('dev-helper.setTaskCategory', async (task: Task) => {
                    const categories = this.tagManager.getCategories();
                    const selectedCategory = await vscode.window.showQuickPick(
                        categories.map(c => ({ label: c.name, value: c })),
                        {
                            placeHolder: 'Selecione a categoria da tarefa'
                        }
                    );

                    if (selectedCategory) {
                        task.category = selectedCategory.value;
                        await this.saveTasks();
                        this.showTaskDetails();
                    }
                })
            );
        } catch (error) {
            if (error instanceof Error) {
                console.log(`Comando dev-helper.setTaskCategory já registrado, ignorando: ${error.message}`);
            } else {
                console.log("Comando dev-helper.setTaskCategory já registrado, ignorando.");
            }
        }

        // Exibir status bar
        this.statusBarItem.show();
        this.updateStatusBar();
    }

    public dispose(): void {
        if (this.urgentTaskCheckInterval) {
            clearInterval(this.urgentTaskCheckInterval);
        }
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

            // Solicitar tempo estimado
            const estimatedTimeStr = await vscode.window.showInputBox({
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

            if (!estimatedTimeStr) return;
            const estimatedTime = parseInt(estimatedTimeStr);

            // Solicitar complexidade
            const complexityStr = await vscode.window.showQuickPick(
                ['1 - Muito Simples', '2 - Simples', '3 - Médio', '4 - Complexo', '5 - Muito Complexo'],
                { placeHolder: 'Selecione a complexidade da tarefa' }
            );

            if (!complexityStr) return;
            const complexity = parseInt(complexityStr[0]);

            // Solicitar impacto
            const impactStr = await vscode.window.showQuickPick(
                ['1 - Baixo Impacto', '2 - Impacto Moderado', '3 - Impacto Médio', '4 - Alto Impacto', '5 - Impacto Crítico'],
                { placeHolder: 'Selecione o impacto da tarefa' }
            );

            if (!impactStr) return;
            const impact = parseInt(impactStr[0]);

            // Solicitar prazo (opcional)
            let deadline: Date | undefined;
            const hasDeadline = await vscode.window.showQuickPick(['Sim', 'Não'], {
                placeHolder: 'Esta tarefa tem prazo?'
            });

            if (hasDeadline === 'Sim') {
                const deadlineStr = await vscode.window.showInputBox({
                    prompt: 'Prazo (DD/MM/YYYY)',
                    placeHolder: 'Digite o prazo no formato DD/MM/YYYY',
                    validateInput: (value) => {
                        const date = new Date(value.split('/').reverse().join('-'));
                        if (isNaN(date.getTime())) return 'Data inválida';
                        if (date < new Date()) return 'A data não pode ser no passado';
                        return null;
                    }
                });

                if (deadlineStr) {
                    deadline = new Date(deadlineStr.split('/').reverse().join('-'));
                }
            }

            // Criar critérios de prioridade
            const priorityCriteria = this.priorityManager.suggestPriorityCriteria(
                estimatedTime,
                complexity,
                impact,
                deadline
            );

            // Obter sugestão de prioridade
            const suggestion = this.prioritySuggestionManager.getPrioritySuggestion(priorityCriteria);
            
            // Mostrar sugestão ao usuário
            const priorityOptions = [
                { label: `Sugerido: ${suggestion.suggestedPriority} (${Math.round(suggestion.confidence * 100)}% confiança)`, priority: suggestion.suggestedPriority },
                { label: 'Urgente', priority: TaskPriority.URGENT },
                { label: 'Alta', priority: TaskPriority.HIGH },
                { label: 'Média', priority: TaskPriority.MEDIUM },
                { label: 'Baixa', priority: TaskPriority.LOW }
            ];

            const selectedPriority = await vscode.window.showQuickPick(priorityOptions, {
                placeHolder: 'Selecione a prioridade da tarefa',
                ignoreFocusOut: true
            });

            if (!selectedPriority) return;

            // Adicionar tags
            const tags = this.tagManager.getTags();
            const selectedTags = await vscode.window.showQuickPick(
                tags.map(t => ({ label: t.name, value: t })),
                {
                    placeHolder: 'Selecione as tags para a tarefa',
                    canPickMany: true
                }
            );

            // Adicionar categoria
            const categories = this.tagManager.getCategories();
            const selectedCategory = await vscode.window.showQuickPick(
                categories.map(c => ({ label: c.name, value: c })),
                {
                    placeHolder: 'Selecione a categoria da tarefa'
                }
            );

            // Criar nova tarefa com a prioridade selecionada
            const newTask: Task = {
                id: Date.now(),
                title: sanitizeHtml(title),
                description: description ? sanitizeHtml(description) : '',
                status: TaskStatus.PENDING,
                priority: selectedPriority.priority,
                priorityCriteria: {
                    complexity,
                    impact,
                    estimatedTime,
                    deadline,
                    dependencies: []
                } as PriorityCriteria,
                xpReward: DEFAULT_XP_REWARD,
                subtasks: [],
                tags: selectedTags?.map(t => t.value) || [],
                category: selectedCategory?.value,
                createdAt: new Date(),
                updatedAt: new Date(),
                focusSessions: []
            };

            // Atualizar prioridade baseado nos critérios
            this.priorityManager.updateTaskPriority(newTask);

            // Validar tarefa antes de adicionar
            const validation = this.validateTask(newTask);
            if (!validation.isValid) {
                vscode.window.showErrorMessage(`Erro ao criar tarefa: ${validation.errors.join(', ')}`);
                return;
            }

            this.tasks.push(newTask);
            await this.saveTasks();

            // Notificar o sistema de gamificação sobre a nova tarefa
            if (this.gamificationManager) {
                const userData = await this.context.globalState.get<UserData>('dev-helper-gamification-data');
                if (userData) {
                    await this.context.globalState.update('dev-helper-gamification-data', {
                        ...userData,
                        totalTasks: (userData.totalTasks || 0) + 1
                    });
                }
            }

            vscode.window.showInformationMessage(
                `Tarefa "${newTask.title}" criada com sucesso! Prioridade: ${newTask.priority}`
            );

            // Se a sugestão tiver alta confiança, mostrar as razões
            if (suggestion.confidence >= 0.7 && suggestion.reasons.length > 0) {
                vscode.window.showInformationMessage(
                    `Sugestão de prioridade baseada em:\n${suggestion.reasons.join('\n')}`,
                    'OK'
                );
            }

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
            // eslint-disable-next-line no-constant-condition
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
                title: sanitizeHtml(title),
                estimatedMinutes,
                    status: TaskStatus.NOT_STARTED
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
            const startTime = subtask.startedAt || new Date();
            const actualTimeSpent = Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60));
            
            subtask.status = TaskStatus.COMPLETED;
            subtask.completedAt = new Date();
            this.updateStatusBar();
            this.showTaskDetails();

            // Verificar se todas as subtarefas foram concluídas
            const allCompleted = this.currentTask.subtasks.every(s => s.status === TaskStatus.COMPLETED);
            if (allCompleted) {
                this.currentTask.status = TaskStatus.COMPLETED;
                this.currentTask.completedAt = new Date();
                this.prioritySuggestionManager.addToHistory(this.currentTask, actualTimeSpent);
                if (this.gamificationManager) {
                    const userData = await this.context.globalState.get<UserData>('dev-helper-gamification-data');
                    if (userData) {
                        await this.context.globalState.update('dev-helper-gamification-data', {
                            ...userData,
                            totalTasks: (userData.totalTasks || 0) + 1,
                            totalSubtasks: (userData.totalSubtasks || 0) + this.currentTask.subtasks.length
                        });
                    }
                    await this.gamificationManager.onTaskCompleted(this.currentTask);
                }
                const { Notifier } = await import('../notifications/notifier');
                Notifier.congratulateTaskCompletion(this.currentTask.title);
            }
        }
    }

    private updateStatusBar(): void {
        if (!this.currentTask) {
            this.statusBarItem.text = '$(tasklist) Nenhuma tarefa selecionada';
            this.statusBarItem.tooltip = 'Clique para selecionar uma tarefa';
            return;
        }

        const completedSubtasks = this.currentTask.subtasks.filter(s => s.status === TaskStatus.COMPLETED).length;
        const totalSubtasks = this.currentTask.subtasks.length;
        const progress = totalSubtasks > 0 
            ? Math.round((completedSubtasks / totalSubtasks) * 100) 
            : 0;

        this.statusBarItem.text = `$(tasklist) ${this.currentTask.title} (${progress}%)`;
        this.statusBarItem.tooltip = `${completedSubtasks}/${totalSubtasks} subtarefas concluídas`;
    }

    private getTaskDetailsContent(task: Task): string {
        const completedSubtasks = task.subtasks.filter(s => s.status === TaskStatus.COMPLETED).length;
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
                                   ${subtask.status === TaskStatus.COMPLETED ? 'checked' : ''}
                                   ${subtask.status === TaskStatus.COMPLETED ? 'disabled' : ''}
                                   onchange="completeSubtask(${subtask.id})">
                            <div class="subtask-info ${subtask.status === TaskStatus.COMPLETED ? 'subtask-completed' : ''}">
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
                tasks: JSON.stringify(this.tasks)
            });
        }
    }

    public getTasks(): Task[] {
        // Retornar tarefas ordenadas por prioridade
        return this.priorityManager.sortTasksByPriority([...this.tasks]);
    }

    public async moveTaskUp(taskId: number): Promise<void> {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index > 0) {
            [this.tasks[index], this.tasks[index - 1]] = [this.tasks[index - 1], this.tasks[index]];
            await this.saveTasks();
            this.updateDashboard();
        }
    }

    public async moveTaskDown(taskId: number): Promise<void> {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index < this.tasks.length - 1) {
            [this.tasks[index], this.tasks[index + 1]] = [this.tasks[index + 1], this.tasks[index]];
            await this.saveTasks();
            this.updateDashboard();
        }
    }

    public async setTaskPriority(taskId: number, priority: TaskPriority): Promise<void> {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.priority = priority;
            task.updatedAt = new Date();
            await this.saveTasks();
            this.updateDashboard();
        }
    }

    public async reorderTasks(taskIds: number[]): Promise<void> {
        // Criar um mapa de índice para cada ID de tarefa
        const taskMap = new Map(this.tasks.map((task, index) => [task.id, index]));
        
        // Reordenar as tarefas de acordo com a nova ordem
        const newTasks = taskIds.map(id => this.tasks[taskMap.get(id)!]);
        
        // Atualizar a lista de tarefas
        this.tasks = newTasks;
        await this.saveTasks();
        this.updateDashboard();
    }

    public async deleteTask(taskId: number): Promise<void> {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            await this.saveTasks();
            this.updateDashboard();
        }
    }

    public async deleteSubtask(taskId: number, subtaskId: number): Promise<void> {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
            await this.saveTasks();
            this.updateDashboard();
        }
    }

    /**
     * Rename an existing task
     */
    public async editTask(taskId: number): Promise<void> {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        const newTitle = await vscode.window.showInputBox({ prompt: 'Novo título da tarefa', value: task.title });
        if (newTitle) {
            task.title = sanitizeHtml(newTitle);
            task.updatedAt = new Date();
            await this.saveTasks();
            this.updateDashboard();
        }
    }

    /**
     * Rename an existing subtask
     */
    public async editSubtask(taskId: number, subtaskId: number): Promise<void> {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        const sub = task.subtasks.find(s => s.id === subtaskId);
        if (!sub) return;
        const newTitle = await vscode.window.showInputBox({ prompt: 'Novo título da subtarefa', value: sub.title });
        if (newTitle) {
            sub.title = sanitizeHtml(newTitle);
            await this.saveTasks();
            this.updateDashboard();
        }
    }

    private startUrgentTaskChecker(): void {
        // Verificar tarefas urgentes a cada 30 minutos
        this.urgentTaskCheckInterval = setInterval(() => {
            this.checkUrgentTasks();
        }, 30 * 60 * 1000);

        // Verificar imediatamente ao iniciar
        this.checkUrgentTasks();
    }

    private async checkUrgentTasks(): Promise<void> {
        const urgentTasks = this.prioritySuggestionManager.getUrgentTasks(this.tasks);
        
        if (urgentTasks.length > 0) {
            const message = urgentTasks.length === 1
                ? `Você tem uma tarefa urgente: "${urgentTasks[0].title}"`
                : `Você tem ${urgentTasks.length} tarefas urgentes que precisam de atenção`;

            const action = await vscode.window.showWarningMessage(
                message,
                'Ver Tarefas',
                'Ignorar'
            );

            if (action === 'Ver Tarefas') {
                vscode.commands.executeCommand('dev-helper.showDashboard');
            }
        }
    }
}