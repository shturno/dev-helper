export enum TaskStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    BLOCKED = 'BLOCKED',
    INTERRUPTED = 'INTERRUPTED',
    NOT_STARTED = 'NOT_STARTED'
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
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

export interface Tag {
    id: string;
    name: string;
    color: string;
    description?: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    parentId?: string;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    estimatedTime?: number;
    actualTime?: number;
    parentTaskId?: number;
    subtasks: Subtask[];
    tags: Tag[];
    category?: Category;
    priorityCriteria: PriorityCriteria;
    focusSessions?: FocusSession[];
    xpReward?: number;
}

export interface FocusSession {
    id: number;
    taskId: number;
    startTime: Date;
    endTime?: Date;
    duration: number;
    interruptions: number;
    notes?: string;
}

export interface TaskMetrics {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    averageCompletionTime: number;
    completionRate: number;
    focusTime: number;
    interruptions: number;
}

export interface TaskValidation {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

export interface TaskUpdateData {
    title?: string;
    description?: string;
    status?: TaskStatus;
    xpReward?: number;
    [key: string]: unknown;
} 