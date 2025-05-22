import * as vscode from 'vscode';
import { TaskTracker } from '../../tasks/tracker';
import { Task, TaskStatus, TaskPriority } from '../../tasks/types';
import { GamificationManager } from '../../gamification/manager';
import { PriorityManager } from '../../tasks/priority-manager';
import { PrioritySuggestionManager } from '../../tasks/priority-suggestions';

// Mock das dependências
jest.mock('../../gamification/manager');
jest.mock('../../tasks/priority-manager');
jest.mock('../../tasks/priority-suggestions');
jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showInputBox: jest.fn(),
        showQuickPick: jest.fn(),
        createStatusBarItem: jest.fn(() => ({
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
            text: '',
            tooltip: '',
            command: ''
        })),
        createWebviewPanel: jest.fn(() => ({
            webview: {
                html: '',
                onDidReceiveMessage: jest.fn()
            },
            onDidDispose: jest.fn()
        }))
    },
    StatusBarAlignment: {
        Left: 1,
        Right: 2
    },
    commands: {
        registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
        executeCommand: jest.fn()
    }
}));

// Mock de tarefa
const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    priorityCriteria: {
        complexity: 3,
        impact: 3,
        estimatedTime: 30,
        dependencies: [],
        deadline: undefined
    },
    xpReward: 10,
    subtasks: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});

describe('TaskTracker', () => {
    let taskTracker: TaskTracker;
    let mockContext: vscode.ExtensionContext;
    let mockGamificationManager: jest.Mocked<GamificationManager>;
    let mockPriorityManager: jest.Mocked<PriorityManager>;
    let mockPrioritySuggestionManager: jest.Mocked<PrioritySuggestionManager>;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset do singleton
        (TaskTracker as any).instance = undefined;

        // Mock do contexto
        mockContext = {
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            subscriptions: []
        } as unknown as vscode.ExtensionContext;

        // Mock dos gerenciadores
        mockGamificationManager = {
            getInstance: jest.fn(),
            onTaskCompleted: jest.fn(),
            getUserData: jest.fn()
        } as unknown as jest.Mocked<GamificationManager>;

        mockPriorityManager = {
            getInstance: jest.fn(),
            suggestPriorityCriteria: jest.fn(),
            updateTaskPriority: jest.fn(),
            sortTasksByPriority: jest.fn(tasks => tasks)
        } as unknown as jest.Mocked<PriorityManager>;

        mockPrioritySuggestionManager = {
            getInstance: jest.fn(),
            getPrioritySuggestion: jest.fn(),
            getUrgentTasks: jest.fn(),
            addToHistory: jest.fn()
        } as unknown as jest.Mocked<PrioritySuggestionManager>;

        // Configurar mocks
        (GamificationManager.getInstance as jest.Mock).mockReturnValue(mockGamificationManager);
        (PriorityManager.getInstance as jest.Mock).mockReturnValue(mockPriorityManager);
        (PrioritySuggestionManager.getInstance as jest.Mock).mockReturnValue(mockPrioritySuggestionManager);

        // Mock dos dados salvos
        (mockContext.globalState.get as jest.Mock).mockReturnValue([]);

        taskTracker = TaskTracker.getInstance(mockContext);
    });

    afterEach(() => {
        (TaskTracker as any).instance = undefined;
    });

    describe('getInstance', () => {
        it('should create a singleton instance', () => {
            const instance1 = TaskTracker.getInstance(mockContext);
            const instance2 = TaskTracker.getInstance(mockContext);
            expect(instance1).toBe(instance2);
        });

        it('should throw error if context is not provided on first initialization', () => {
            expect(() => TaskTracker.getInstance()).toThrow('Context is required to initialize TaskTracker');
        });
    });

    describe('loadTasks', () => {
        it('should load tasks from global state', async () => {
            const mockTasks = [createMockTask(), createMockTask()];
            (mockContext.globalState.get as jest.Mock).mockReturnValue(mockTasks);

            await (taskTracker as any).loadTasks();
            const tasks = taskTracker.getTasks();
            expect(tasks).toHaveLength(2);
            expect(tasks[0]).toEqual(expect.objectContaining({
                title: 'Test Task',
                status: TaskStatus.PENDING
            }));
        });

        it('should handle invalid task data', async () => {
            const invalidTasks = [
                { ...createMockTask(), title: '' }, // Título inválido
                { ...createMockTask(), status: 'INVALID_STATUS' }, // Status inválido
                null,
                undefined
            ];
            (mockContext.globalState.get as jest.Mock).mockReturnValue(invalidTasks);

            await (taskTracker as any).loadTasks();
            const tasks = taskTracker.getTasks();
            expect(tasks).toHaveLength(0);
        });
    });

    describe('saveTasks', () => {
        it('should save tasks to global state', async () => {
            const mockTasks = [createMockTask(), createMockTask()];
            (taskTracker as any).tasks = mockTasks;

            await (taskTracker as any).saveTasks();
            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'tdah-tasks',
                expect.arrayContaining([
                    expect.objectContaining({
                        title: 'Test Task',
                        status: TaskStatus.PENDING
                    })
                ])
            );
        });

        it('should handle save errors', async () => {
            const mockTasks = [createMockTask()];
            (taskTracker as any).tasks = mockTasks;
            (mockContext.globalState.update as jest.Mock).mockRejectedValue(new Error('Save failed'));

            await (taskTracker as any).saveTasks();
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Erro ao salvar tarefas');
        });
    });

    describe('createTask', () => {
        beforeEach(() => {
            (vscode.window.showInputBox as jest.Mock).mockImplementation((options) => {
                if (options.prompt === 'Título da tarefa') return 'New Task';
                if (options.prompt === 'Descrição da tarefa (opcional)') return 'New Description';
                if (options.prompt === 'Tempo estimado (em minutos)') return '45';
                return null;
            });

            (vscode.window.showQuickPick as jest.Mock).mockImplementation((items) => {
                if (items.includes('Sim')) return 'Sim';
                if (items.includes('Não')) return 'Não';
                if (items[0].includes('1 -')) return '1 - Muito Simples';
                if (items[0].includes('Baixo Impacto')) return '1 - Baixo Impacto';
                return null;
            });

            (mockPriorityManager.suggestPriorityCriteria as jest.Mock).mockReturnValue({
                complexity: 1,
                impact: 1,
                estimatedTime: 45,
                dependencies: []
            });

            (mockPrioritySuggestionManager.getPrioritySuggestion as jest.Mock).mockReturnValue({
                suggestedPriority: TaskPriority.MEDIUM,
                confidence: 0.8,
                reasons: ['Tempo estimado moderado']
            });
        });

        it('should create a new task with valid input', async () => {
            await taskTracker.createTask();

            const tasks = taskTracker.getTasks();
            expect(tasks).toHaveLength(1);
            expect(tasks[0]).toEqual(expect.objectContaining({
                title: 'New Task',
                description: 'New Description',
                status: TaskStatus.PENDING,
                priority: TaskPriority.MEDIUM
            }));
        });

        it('should validate task input', async () => {
            (vscode.window.showInputBox as jest.Mock).mockImplementation((options) => {
                if (options.prompt === 'Título da tarefa') return '';
                return null;
            });

            await taskTracker.createTask();
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
            expect(taskTracker.getTasks()).toHaveLength(0);
        });

        it('should handle task creation cancellation', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue(undefined);

            await taskTracker.createTask();
            expect(taskTracker.getTasks()).toHaveLength(0);
        });
    });

    describe('task management', () => {
        let mockTask: Task;

        beforeEach(() => {
            mockTask = createMockTask();
            (taskTracker as any).tasks = [mockTask];
        });

        it('should move task up', async () => {
            const task2 = createMockTask({ id: Date.now() + 1 });
            (taskTracker as any).tasks = [mockTask, task2];

            await taskTracker.moveTaskUp(task2.id);
            const tasks = taskTracker.getTasks();
            expect(tasks[0].id).toBe(task2.id);
            expect(tasks[1].id).toBe(mockTask.id);
        });

        it('should move task down', async () => {
            const task2 = createMockTask({ id: Date.now() + 1 });
            (taskTracker as any).tasks = [mockTask, task2];

            await taskTracker.moveTaskDown(mockTask.id);
            const tasks = taskTracker.getTasks();
            expect(tasks[0].id).toBe(task2.id);
            expect(tasks[1].id).toBe(mockTask.id);
        });

        it('should set task priority', async () => {
            await taskTracker.setTaskPriority(mockTask.id, TaskPriority.HIGH);
            const tasks = taskTracker.getTasks();
            expect(tasks[0].priority).toBe(TaskPriority.HIGH);
        });

        it('should reorder tasks', async () => {
            const task2 = createMockTask({ id: Date.now() + 1 });
            const task3 = createMockTask({ id: Date.now() + 2 });
            (taskTracker as any).tasks = [mockTask, task2, task3];

            await taskTracker.reorderTasks([task3.id, task2.id, mockTask.id]);
            const tasks = taskTracker.getTasks();
            expect(tasks[0].id).toBe(task3.id);
            expect(tasks[1].id).toBe(task2.id);
            expect(tasks[2].id).toBe(mockTask.id);
        });
    });

    describe('subtask management', () => {
        let mockTask: Task;

        beforeEach(() => {
            mockTask = createMockTask();
            (taskTracker as any).tasks = [mockTask];
            (taskTracker as any).currentTask = mockTask;
        });

        it('should complete subtask', async () => {
            const subtask = {
                id: Date.now(),
                title: 'Test Subtask',
                estimatedMinutes: 15,
                status: TaskStatus.NOT_STARTED
            };
            mockTask.subtasks = [subtask];

            await (taskTracker as any).completeSubtask(subtask.id);
            expect(mockTask.subtasks[0].status).toBe(TaskStatus.COMPLETED);
            expect(mockTask.subtasks[0].completedAt).toBeDefined();
        });

        it('should complete parent task when all subtasks are done', async () => {
            const subtask = {
                id: Date.now(),
                title: 'Test Subtask',
                estimatedMinutes: 15,
                status: TaskStatus.NOT_STARTED
            };
            mockTask.subtasks = [subtask];

            await (taskTracker as any).completeSubtask(subtask.id);
            expect(mockTask.status).toBe(TaskStatus.COMPLETED);
            expect(mockTask.completedAt).toBeDefined();
            expect(mockGamificationManager.onTaskCompleted).toHaveBeenCalledWith(mockTask);
        });
    });

    describe('task validation', () => {
        it('should validate task title length', () => {
            const task = createMockTask({
                title: 'a'.repeat(101) // Exceeds MAX_TITLE_LENGTH
            });
            const validation = (taskTracker as any).validateTask(task);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Título deve ter no máximo 100 caracteres');
        });

        it('should validate task description length', () => {
            const task = createMockTask({
                description: 'a'.repeat(501) // Exceeds MAX_DESCRIPTION_LENGTH
            });
            const validation = (taskTracker as any).validateTask(task);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Descrição deve ter no máximo 500 caracteres');
        });

        it('should validate subtask count', () => {
            const subtasks = Array(21).fill(null).map(() => ({
                id: Date.now(),
                title: 'Test Subtask',
                estimatedMinutes: 15,
                status: TaskStatus.NOT_STARTED
            }));
            const task = createMockTask({ subtasks });
            const validation = (taskTracker as any).validateTask(task);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Máximo de 20 subtarefas por tarefa');
        });

        it('should validate subtask estimated time', () => {
            const task = createMockTask({
                subtasks: [{
                    id: Date.now(),
                    title: 'Test Subtask',
                    estimatedMinutes: 481, // Exceeds MAX_ESTIMATED_MINUTES
                    status: TaskStatus.NOT_STARTED
                }]
            });
            const validation = (taskTracker as any).validateTask(task);
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('tempo estimado inválido');
        });
    });

    describe('decomposeCurrentTask', () => {
        beforeEach(() => {
            (vscode.window.showInputBox as jest.Mock).mockImplementation((options) => {
                if (options.prompt === 'Título da subtarefa') return 'New Subtask';
                if (options.prompt === 'Tempo estimado (em minutos)') return '30';
                return null;
            });
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue('Sim');
        });

        it('should decompose task with valid input', async () => {
            const mockTask = createMockTask();
            (taskTracker as any).tasks = [mockTask];
            (taskTracker as any).currentTask = mockTask;
            await taskTracker.decomposeCurrentTask();

            expect(mockTask.subtasks).toHaveLength(1);
            expect(mockTask.subtasks[0]).toEqual(expect.objectContaining({
                title: 'New Subtask',
                estimatedMinutes: 30,
                status: TaskStatus.NOT_STARTED
            }));
        });

        it('should handle task not found', async () => {
            (taskTracker as any).currentTask = undefined;
            await taskTracker.decomposeCurrentTask();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Nenhuma tarefa selecionada');
        });

        it('should handle decomposition cancellation', async () => {
            const mockTask = createMockTask();
            (taskTracker as any).tasks = [mockTask];
            (taskTracker as any).currentTask = mockTask;
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue('Não');

            await taskTracker.decomposeCurrentTask();
            expect(mockTask.subtasks).toHaveLength(0);
        });

        it('should handle subtask limit reached', async () => {
            const mockTask = createMockTask({
                subtasks: Array(20).fill(null).map(() => ({
                    id: Date.now(),
                    title: 'Test Subtask',
                    estimatedMinutes: 15,
                    status: TaskStatus.NOT_STARTED
                }))
            });
            (taskTracker as any).tasks = [mockTask];
            (taskTracker as any).currentTask = mockTask;

            await taskTracker.decomposeCurrentTask();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Limite máximo de 20 subtarefas atingido');
        });
    });

    describe('task selection and details', () => {
        it('should select task from quick pick', async () => {
            const mockTask = createMockTask();
            (taskTracker as any).tasks = [mockTask];
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: mockTask.title,
                description: mockTask.description,
                task: mockTask
            });

            const selectedTask = await (taskTracker as any).selectTask();
            expect(selectedTask).toBe(mockTask);
            expect((taskTracker as any).currentTask).toBe(mockTask);
        });

        it('should handle task selection cancellation', async () => {
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue(undefined);
            const selectedTask = await (taskTracker as any).selectTask();
            expect(selectedTask).toBeUndefined();
        });

        it('should show task details', async () => {
            const mockTask = createMockTask();
            (taskTracker as any).currentTask = mockTask;
            (vscode.window.createWebviewPanel as jest.Mock).mockReturnValue({
                webview: {
                    html: '',
                    onDidReceiveMessage: jest.fn()
                },
                onDidDispose: jest.fn()
            });

            await (taskTracker as any).showTaskDetails();
            expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
        });

        it('should handle showing details without selected task', async () => {
            (taskTracker as any).currentTask = undefined;
            await (taskTracker as any).showTaskDetails();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Nenhuma tarefa selecionada');
        });
    });

    describe('urgent task checking', () => {
        it('should check for urgent tasks', async () => {
            const mockTask = createMockTask({ priority: TaskPriority.URGENT });
            (taskTracker as any).tasks = [mockTask];
            (mockPrioritySuggestionManager.getUrgentTasks as jest.Mock).mockReturnValue([mockTask]);
            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue('Ver Tarefas');

            await (taskTracker as any).checkUrgentTasks();
            expect(vscode.window.showWarningMessage).toHaveBeenCalled();
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('dev-helper.showDashboard');
        });

        it('should handle multiple urgent tasks', async () => {
            const mockTasks = [
                createMockTask({ priority: TaskPriority.URGENT, title: 'Task 1' }),
                createMockTask({ priority: TaskPriority.URGENT, title: 'Task 2' })
            ];
            (taskTracker as any).tasks = mockTasks;
            (mockPrioritySuggestionManager.getUrgentTasks as jest.Mock).mockReturnValue(mockTasks);

            await (taskTracker as any).checkUrgentTasks();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('2 tarefas urgentes'),
                'Ver Tarefas',
                'Ignorar'
            );
        });
    });

    describe('status bar updates', () => {
        it('should update status bar with no task selected', () => {
            (taskTracker as any).currentTask = undefined;
            (taskTracker as any).updateStatusBar();
            expect((taskTracker as any).statusBarItem.text).toBe('$(tasklist) Nenhuma tarefa selecionada');
        });

        it('should update status bar with task progress', () => {
            const mockTask = createMockTask({
                subtasks: [
                    { id: 1, title: 'Subtask 1', estimatedMinutes: 15, status: TaskStatus.COMPLETED },
                    { id: 2, title: 'Subtask 2', estimatedMinutes: 15, status: TaskStatus.NOT_STARTED }
                ]
            });
            (taskTracker as any).currentTask = mockTask;
            (taskTracker as any).updateStatusBar();
            expect((taskTracker as any).statusBarItem.text).toBe('$(tasklist) Test Task (50%)');
        });
    });

    describe('error handling', () => {
        it('should handle load tasks error', async () => {
            (mockContext.globalState.get as jest.Mock).mockRejectedValue(new Error('Load failed'));
            await (taskTracker as any).loadTasks();
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('Erro ao carregar tarefas salvas');
        });

        it('should handle invalid task data during load', async () => {
            (mockContext.globalState.get as jest.Mock).mockReturnValue([
                { invalid: 'data' },
                null,
                undefined
            ]);
            await (taskTracker as any).loadTasks();
            const tasks = taskTracker.getTasks();
            expect(tasks).toHaveLength(0);
        });

        it('should handle task creation validation errors', async () => {
            (vscode.window.showInputBox as jest.Mock).mockImplementation((options) => {
                if (options.validateInput) {
                    return options.validateInput('invalid input');
                }
                return null;
            });

            await taskTracker.createTask();
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });
    });
}); 