import { PriorityManager } from '../../tasks/priority-manager';
import { TaskPriority, PriorityCriteria, Task, TaskStatus } from '../../tasks/types';

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

describe('PriorityManager', () => {
    let priorityManager: PriorityManager;

    beforeEach(() => {
        // Reset do singleton
        (PriorityManager as any).instance = undefined;
        priorityManager = PriorityManager.getInstance();
    });

    afterEach(() => {
        (PriorityManager as any).instance = undefined;
    });

    describe('getInstance', () => {
        it('should create a singleton instance', () => {
            const instance1 = PriorityManager.getInstance();
            const instance2 = PriorityManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('calculatePriority', () => {
        it('should calculate URGENT priority for high complexity and impact', () => {
            const criteria: PriorityCriteria = {
                complexity: 5,
                impact: 5,
                estimatedTime: 30,
                dependencies: []
            };

            const priority = priorityManager.calculatePriority(criteria);
            expect(priority).toBe(TaskPriority.URGENT);
        });

        it('should calculate HIGH priority for medium complexity and high impact', () => {
            const criteria: PriorityCriteria = {
                complexity: 3,
                impact: 5,
                estimatedTime: 30,
                dependencies: []
            };

            const priority = priorityManager.calculatePriority(criteria);
            expect(priority).toBe(TaskPriority.HIGH);
        });

        it('should calculate MEDIUM priority for balanced criteria', () => {
            const criteria: PriorityCriteria = {
                complexity: 3,
                impact: 3,
                estimatedTime: 30,
                dependencies: []
            };

            const priority = priorityManager.calculatePriority(criteria);
            expect(priority).toBe(TaskPriority.MEDIUM);
        });

        it('should calculate LOW priority for low complexity and impact', () => {
            const criteria: PriorityCriteria = {
                complexity: 1,
                impact: 1,
                estimatedTime: 30,
                dependencies: []
            };

            const priority = priorityManager.calculatePriority(criteria);
            expect(priority).toBe(TaskPriority.LOW);
        });

        it('should consider dependencies in priority calculation', () => {
            const criteria: PriorityCriteria = {
                complexity: 2,
                impact: 2,
                estimatedTime: 30,
                dependencies: ['1', '2', '3', '4', '5'] // 5 dependências como strings
            };

            const priority = priorityManager.calculatePriority(criteria);
            expect(priority).toBe(TaskPriority.HIGH);
        });

        it('should consider deadline in priority calculation', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const criteria: PriorityCriteria = {
                complexity: 2,
                impact: 2,
                estimatedTime: 30,
                dependencies: [],
                deadline: tomorrow
            };

            const priority = priorityManager.calculatePriority(criteria);
            expect(priority).toBe(TaskPriority.HIGH);
        });

        it('should give maximum priority to overdue tasks', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const criteria: PriorityCriteria = {
                complexity: 1,
                impact: 1,
                estimatedTime: 30,
                dependencies: [],
                deadline: yesterday
            };

            const priority = priorityManager.calculatePriority(criteria);
            expect(priority).toBe(TaskPriority.URGENT);
        });
    });

    describe('updateTaskPriority', () => {
        it('should update task priority based on current criteria', () => {
            const task = createMockTask({
                priority: TaskPriority.LOW,
                priorityCriteria: {
                    complexity: 5,
                    impact: 5,
                    estimatedTime: 30,
                    dependencies: []
                }
            });

            const updatedTask = priorityManager.updateTaskPriority(task);
            expect(updatedTask.priority).toBe(TaskPriority.URGENT);
            expect(updatedTask.updatedAt).toBeInstanceOf(Date);
        });

        it('should not update task if priority remains the same', () => {
            const task = createMockTask({
                priority: TaskPriority.MEDIUM,
                priorityCriteria: {
                    complexity: 3,
                    impact: 3,
                    estimatedTime: 30,
                    dependencies: []
                }
            });

            const originalUpdatedAt = task.updatedAt;
            const updatedTask = priorityManager.updateTaskPriority(task);
            expect(updatedTask.priority).toBe(TaskPriority.MEDIUM);
            expect(updatedTask.updatedAt).toBe(originalUpdatedAt);
        });
    });

    describe('suggestPriorityCriteria', () => {
        it('should suggest valid priority criteria with default values', () => {
            const criteria = priorityManager.suggestPriorityCriteria(30);
            expect(criteria).toEqual({
                complexity: 3,
                impact: 3,
                estimatedTime: 30,
                dependencies: []
            });
        });

        it('should clamp complexity and impact values between 1 and 5', () => {
            const criteria = priorityManager.suggestPriorityCriteria(30, 10, 0);
            expect(criteria.complexity).toBe(5);
            expect(criteria.impact).toBe(1);
        });

        it('should include deadline if provided', () => {
            const deadline = new Date();
            const criteria = priorityManager.suggestPriorityCriteria(30, 3, 3, deadline);
            expect(criteria.deadline).toBe(deadline);
        });

        it('should ensure estimated time is non-negative', () => {
            const criteria = priorityManager.suggestPriorityCriteria(-10);
            expect(criteria.estimatedTime).toBe(0);
        });
    });

    describe('sortTasksByPriority', () => {
        it('should sort tasks by priority in descending order', () => {
            const tasks = [
                createMockTask({ priority: TaskPriority.LOW }),
                createMockTask({ priority: TaskPriority.URGENT }),
                createMockTask({ priority: TaskPriority.MEDIUM }),
                createMockTask({ priority: TaskPriority.HIGH })
            ];

            const sortedTasks = priorityManager.sortTasksByPriority(tasks);
            expect(sortedTasks.map(t => t.priority)).toEqual([
                TaskPriority.URGENT,
                TaskPriority.HIGH,
                TaskPriority.MEDIUM,
                TaskPriority.LOW
            ]);
        });

        it('should maintain stable sort for tasks with same priority', () => {
            const task1 = createMockTask({ id: 1, priority: TaskPriority.MEDIUM });
            const task2 = createMockTask({ id: 2, priority: TaskPriority.MEDIUM });
            const task3 = createMockTask({ id: 3, priority: TaskPriority.MEDIUM });

            const tasks = [task2, task1, task3];
            const sortedTasks = priorityManager.sortTasksByPriority(tasks);
            expect(sortedTasks.map(t => t.id)).toEqual([2, 1, 3]);
        });
    });
}); 