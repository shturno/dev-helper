import * as vscode from 'vscode';
import { GamificationManager } from '../../gamification/manager';
import { Task, TaskStatus, TaskPriority } from '../../tasks/types';

// Mock do contexto
const createMockContext = () => ({
    globalState: {
        get: jest.fn(),
        update: jest.fn()
    },
    subscriptions: []
} as unknown as vscode.ExtensionContext);

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

describe('GamificationManager', () => {
    let mockContext: vscode.ExtensionContext;
    let gamificationManager: GamificationManager;

    beforeEach(() => {
        // Reset dos mocks
        jest.clearAllMocks();
        // Reset do singleton
        (GamificationManager as any).instance = undefined;

        // Mock do contexto
        mockContext = createMockContext();
        
        // Estado mutável para simular o globalState
        let gamificationData = {
            level: 1,
            xp_points: 0,
            xp_for_next_level: 100,
            title: 'Iniciante',
            achievements: [],
            totalTasks: 0,
            totalSubtasks: 0,
            totalFocusTime: 0,
            streak: 0,
            lastTaskDate: null
        };
        (mockContext.globalState.get as jest.Mock).mockImplementation((key) => {
            if (key === 'dev-helper-gamification-data') {
                // Retorna uma cópia para simular atualização
                return { ...gamificationData, achievements: [...gamificationData.achievements] };
            }
            return null;
        });
        (mockContext.globalState.update as jest.Mock).mockImplementation((key, value) => {
            if (key === 'dev-helper-gamification-data') {
                gamificationData = { ...value, achievements: Array.isArray(value.achievements) ? [...value.achievements] : [] };
            }
            return Promise.resolve();
        });
    });

    afterEach(() => {
        if (gamificationManager) {
            gamificationManager.dispose();
        }
        (GamificationManager as any).instance = undefined;
    });

    describe('getInstance', () => {
        it('should create a singleton instance', async () => {
            gamificationManager = await GamificationManager.getInstance(mockContext);
            const instance1 = await GamificationManager.getInstance(mockContext);
            const instance2 = await GamificationManager.getInstance(mockContext);
            expect(instance1).toBe(instance2);
        });

        it('should throw error if context is not provided on first initialization', async () => {
            await expect(GamificationManager.getInstance()).rejects.toThrow('Context is required to initialize GamificationManager');
        });
    });

    describe('initialize', () => {
        it('should initialize with default values if no data exists', async () => {
            (mockContext.globalState.get as jest.Mock).mockReturnValue(null);
            gamificationManager = await GamificationManager.getInstance(mockContext);
            await gamificationManager.initialize();

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-gamification-data',
                expect.objectContaining({
                    level: 1,
                    xp_points: 0,
                    xp_for_next_level: 100,
                    title: 'Iniciante'
                })
            );
        });

        it('should load existing data if available', async () => {
            const existingData = {
                level: 5,
                xp_points: 450,
                xp_for_next_level: 500,
                title: 'Desenvolvedor',
                achievements: ['first_task'],
                totalTasks: 10,
                totalSubtasks: 25,
                totalFocusTime: 3600,
                streak: 3,
                lastTaskDate: new Date()
            };

            (mockContext.globalState.get as jest.Mock).mockReturnValue(existingData);
            gamificationManager = await GamificationManager.getInstance(mockContext);
            await gamificationManager.initialize();

            const userData = await gamificationManager.getUserData();
            expect(userData).toEqual(expect.objectContaining({
                ...existingData,
                lastTaskDate: expect.any(Date)
            }));
        });
    });

    describe('onTaskCompleted', () => {
        it('should add XP and update level when task is completed', async () => {
            gamificationManager = await GamificationManager.getInstance(mockContext);
            await gamificationManager.initialize();

            const task = createMockTask({ xpReward: 50 });
            await gamificationManager.onTaskCompleted(task);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-gamification-data',
                expect.objectContaining({
                    xp_points: expect.any(Number),
                    level: 1,
                    totalTasks: 1
                })
            );
        });

        it('should level up when XP threshold is reached', async () => {
            // Setup: User with 95 XP (almost level 2)
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                level: 1,
                xp_points: 95,
                xp_for_next_level: 100,
                title: 'Iniciante',
                achievements: [],
                totalTasks: 0,
                totalSubtasks: 0,
                totalFocusTime: 0,
                streak: 0,
                lastTaskDate: null
            });

            gamificationManager = await GamificationManager.getInstance(mockContext);
            await gamificationManager.initialize();

            const task = createMockTask({ xpReward: 10 });
            await gamificationManager.onTaskCompleted(task);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-gamification-data',
                expect.objectContaining({
                    xp_points: expect.any(Number),
                    level: 2,
                    xp_for_next_level: 200,
                    title: expect.any(String)
                })
            );
        });
    });

    describe('achievements', () => {
        it('should unlock first_task achievement on first task completion', async () => {
            gamificationManager = await GamificationManager.getInstance(mockContext);
            await gamificationManager.initialize();

            const task = createMockTask();
            await gamificationManager.onTaskCompleted(task);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-gamification-data',
                expect.objectContaining({
                    achievements: ['first_task']
                })
            );
        });

        it('should unlock task_warrior achievement after 50 tasks', async () => {
            // Setup: User with 49 tasks completed
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                level: 1,
                xp_points: 0,
                xp_for_next_level: 100,
                title: 'Iniciante',
                achievements: ['first_task'],
                totalTasks: 49,
                totalSubtasks: 0,
                totalFocusTime: 0,
                streak: 0,
                lastTaskDate: null
            });

            gamificationManager = await GamificationManager.getInstance(mockContext);
            await gamificationManager.initialize();

            const task = createMockTask();
            await gamificationManager.onTaskCompleted(task);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-gamification-data',
                expect.objectContaining({
                    achievements: expect.arrayContaining(['first_task', 'task_warrior'])
                })
            );
        });
    });

    describe('streak management', () => {
        it('should increment streak for consecutive days', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                level: 1,
                xp_points: 0,
                xp_for_next_level: 100,
                title: 'Iniciante',
                achievements: [],
                totalTasks: 0,
                totalSubtasks: 0,
                totalFocusTime: 0,
                streak: 1,
                lastTaskDate: yesterday
            });

            gamificationManager = await GamificationManager.getInstance(mockContext);
            await gamificationManager.initialize();

            const task = createMockTask();
            await gamificationManager.onTaskCompleted(task);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-gamification-data',
                expect.objectContaining({
                    streak: 2
                })
            );
        });

        it('should reset streak after missing a day', async () => {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                level: 1,
                xp_points: 0,
                xp_for_next_level: 100,
                title: 'Iniciante',
                achievements: [],
                totalTasks: 0,
                totalSubtasks: 0,
                totalFocusTime: 0,
                streak: 5,
                lastTaskDate: twoDaysAgo
            });

            gamificationManager = await GamificationManager.getInstance(mockContext);
            await gamificationManager.initialize();

            const task = createMockTask();
            await gamificationManager.onTaskCompleted(task);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-gamification-data',
                expect.objectContaining({
                    streak: 1
                })
            );
        });
    });
}); 