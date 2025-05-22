import * as vscode from 'vscode';
import { AnalysisManager } from '../../analysis/manager';
import { Task, TaskStatus, TaskPriority } from '../../tasks/types';

// Mock do vscode
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn()
        }))
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

describe('AnalysisManager', () => {
    let analysisManager: AnalysisManager;
    let mockContext: vscode.ExtensionContext;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset do singleton
        (AnalysisManager as any).instance = undefined;

        // Mock do contexto
        mockContext = {
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            subscriptions: []
        } as unknown as vscode.ExtensionContext;

        // Mock dos dados de estatísticas
        (mockContext.globalState.get as jest.Mock).mockImplementation((key) => {
            if (key === 'dev-helper-analysis-stats') {
                return {
                    dailyStats: [],
                    monthlyStats: [],
                    insights: []
                };
            }
            return null;
        });

        analysisManager = AnalysisManager.getInstance(mockContext);
    });

    afterEach(() => {
        (AnalysisManager as any).instance = undefined;
    });

    describe('getInstance', () => {
        it('should create a singleton instance', () => {
            const instance1 = AnalysisManager.getInstance(mockContext);
            const instance2 = AnalysisManager.getInstance(mockContext);
            expect(instance1).toBe(instance2);
        });

        it('should throw error if context is not provided on first initialization', () => {
            expect(() => AnalysisManager.getInstance()).toThrow('Context is required to initialize AnalysisManager');
        });
    });

    describe('updateStats', () => {
        it('should update daily stats with focus time and tasks', async () => {
            const today = new Date();
            const tasks = [
                createMockTask({ status: TaskStatus.COMPLETED }),
                createMockTask({ status: TaskStatus.PENDING })
            ];

            await analysisManager.updateStats(tasks);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-analysis-stats',
                expect.objectContaining({
                    dailyStats: expect.arrayContaining([
                        expect.objectContaining({
                            date: today.toISOString().split('T')[0],
                            focusTime: 60,
                            completedTasks: 1,
                            totalTasks: 2
                        })
                    ])
                })
            );
        });

        it('should update monthly stats correctly', async () => {
            const today = new Date();
            const monthStr = today.toISOString().slice(0, 7); // YYYY-MM
            const tasks = [
                createMockTask({ status: TaskStatus.COMPLETED }),
                createMockTask({ status: TaskStatus.COMPLETED })
            ];

            await analysisManager.updateStats(tasks);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-analysis-stats',
                expect.objectContaining({
                    monthlyStats: expect.arrayContaining([
                        expect.objectContaining({
                            month: monthStr,
                            totalFocusTime: 120,
                            totalTasks: 2,
                            completedTasks: 2
                        })
                    ])
                })
            );
        });

        it('should update best day in monthly stats', async () => {
            const today = new Date();
            const monthStr = today.toISOString().slice(0, 7);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Setup: Estatísticas existentes
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                dailyStats: [
                    {
                        date: yesterday.toISOString().split('T')[0],
                        focusTime: 30,
                        completedTasks: 1,
                        totalTasks: 1
                    }
                ],
                monthlyStats: [],
                insights: []
            });

            const tasks = [createMockTask({ status: TaskStatus.COMPLETED })];
            await analysisManager.updateStats(tasks);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-analysis-stats',
                expect.objectContaining({
                    monthlyStats: expect.arrayContaining([
                        expect.objectContaining({
                            month: monthStr,
                            bestDay: today.toISOString().split('T')[0],
                            bestDayFocusTime: 60
                        })
                    ])
                })
            );
        });
    });

    describe('updateInsights', () => {
        it('should generate productivity trend insight', async () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Setup: Estatísticas com tendência de aumento
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                dailyStats: [
                    {
                        date: yesterday.toISOString().split('T')[0],
                        productivityScore: 50,
                        tasksCompleted: 1,
                        totalFocusTime: 30,
                        taskCompletionRate: 0.5
                    },
                    {
                        date: today.toISOString().split('T')[0],
                        productivityScore: 80,
                        tasksCompleted: 2,
                        totalFocusTime: 60,
                        taskCompletionRate: 1.0
                    }
                ],
                monthlyStats: [],
                insights: []
            });

            await (analysisManager as any).updateInsights();
            const insights = await analysisManager.getInsights();
            expect(insights).toContainEqual(expect.objectContaining({
                type: 'productivity_trend',
                message: expect.stringContaining('aumentando')
            }));
        });

        it('should generate streak insight', async () => {
            const today = new Date();
            const dates = Array.from({ length: 5 }, (_, i) => {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            });

            // Setup: Estatísticas com streak
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                dailyStats: dates.map(date => ({
                    date,
                    productivityScore: 80,
                    tasksCompleted: 2,
                    totalFocusTime: 60,
                    taskCompletionRate: 1.0
                })),
                monthlyStats: [],
                insights: []
            });

            await (analysisManager as any).updateInsights();
            const insights = await analysisManager.getInsights();
            expect(insights).toContainEqual(expect.objectContaining({
                type: 'streak',
                message: expect.stringContaining('5 dias')
            }));
        });

        it('should generate focus time insight', async () => {
            const today = new Date();
            const dates = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            });

            // Setup: Estatísticas com alto tempo de foco
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                dailyStats: dates.map(date => ({
                    date,
                    productivityScore: 80,
                    tasksCompleted: 2,
                    totalFocusTime: 300, // 5 horas por dia
                    taskCompletionRate: 1.0
                })),
                monthlyStats: [],
                insights: []
            });

            await (analysisManager as any).updateInsights();
            const insights = await analysisManager.getInsights();
            expect(insights).toContainEqual(expect.objectContaining({
                type: 'focus_time',
                message: expect.stringContaining('Excelente tempo de foco')
            }));
        });

        it('should generate efficiency insight', async () => {
            const today = new Date();
            const dates = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            });

            // Setup: Estatísticas com alta eficiência
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                dailyStats: dates.map(date => ({
                    date,
                    productivityScore: 90,
                    tasksCompleted: 5,
                    totalFocusTime: 240,
                    taskCompletionRate: 0.9
                })),
                monthlyStats: [],
                insights: []
            });

            await (analysisManager as any).updateInsights();
            const insights = await analysisManager.getInsights();
            expect(insights).toContainEqual(expect.objectContaining({
                type: 'efficiency',
                message: expect.stringContaining('taxa de conclusão')
            }));
        });
    });

    describe('getStats', () => {
        it('should return current stats', async () => {
            const mockStats = {
                dailyStats: [
                    {
                        date: new Date().toISOString().split('T')[0],
                        focusTime: 60,
                        completedTasks: 1,
                        totalTasks: 1
                    }
                ],
                monthlyStats: [],
                insights: []
            };

            (mockContext.globalState.get as jest.Mock).mockReturnValue(mockStats);
            const stats = await analysisManager.getStats();
            expect(stats).toEqual(mockStats);
        });

        it('should return empty stats if none exist', async () => {
            (mockContext.globalState.get as jest.Mock).mockReturnValue(null);
            const stats = await analysisManager.getStats();
            expect(stats).toEqual({
                dailyStats: [],
                monthlyStats: [],
                insights: []
            });
        });
    });

    describe('getInsights', () => {
        it('should return current insights', async () => {
            const mockInsights = [
                {
                    type: 'productivity_trend',
                    message: 'Sua produtividade está aumentando!',
                    date: new Date()
                },
                {
                    type: 'streak',
                    message: 'Você manteve um streak de 5 dias! Continue assim!',
                    date: new Date()
                }
            ];

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                dailyStats: [],
                monthlyStats: [],
                insights: mockInsights
            });

            const insights = await analysisManager.getInsights();
            expect(insights).toEqual(mockInsights);
        });

        it('should return empty array if no insights exist', async () => {
            (mockContext.globalState.get as jest.Mock).mockReturnValue(null);
            const insights = await analysisManager.getInsights();
            expect(insights).toEqual([]);
        });

        it('should get insights of different types', async () => {
            const mockInsights = [
                {
                    type: 'productivity_trend',
                    message: 'Sua produtividade está aumentando!',
                    date: new Date()
                },
                {
                    type: 'streak',
                    message: 'Você manteve um streak de 5 dias!',
                    date: new Date()
                },
                {
                    type: 'focus_time',
                    message: 'Excelente tempo de foco!',
                    date: new Date()
                },
                {
                    type: 'efficiency',
                    message: 'Sua taxa de conclusão está excelente!',
                    date: new Date()
                }
            ];

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                dailyStats: [],
                monthlyStats: [],
                insights: mockInsights
            });

            const insights = await analysisManager.getInsights();
            expect(insights).toHaveLength(4);
            expect(insights.map(i => i.type)).toEqual([
                'productivity_trend',
                'streak',
                'focus_time',
                'efficiency'
            ]);
        });
    });
}); 