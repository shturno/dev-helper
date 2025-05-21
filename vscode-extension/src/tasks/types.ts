export enum TaskStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    NOT_STARTED = 'not_started',
    PAUSED = 'paused'
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export interface PriorityCriteria {
    complexity: number;
    impact: number;
    estimatedTime: number;
    deadline?: Date;
    dependencies: string[];
}

export interface Subtask {
    id: number;
    title: string;
    description?: string;
    estimatedMinutes: number;
    status: TaskStatus;
    startedAt?: Date;
    completedAt?: Date;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    priorityCriteria: PriorityCriteria;
    xpReward: number;
    subtasks: Subtask[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

export interface TaskValidation {
    isValid: boolean;
    errors: string[];
}

export interface TaskUpdateData {
    title?: string;
    description?: string;
    status?: TaskStatus;
    xpReward?: number;
    [key: string]: unknown;
} 