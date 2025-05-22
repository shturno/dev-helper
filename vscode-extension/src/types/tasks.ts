export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export enum TaskStatus {
    NOT_STARTED = 'NOT_STARTED',
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    BLOCKED = 'BLOCKED',
    INTERRUPTED = 'INTERRUPTED'
}

export interface Subtask {
    id: number;
    title: string;
    completed: boolean;
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

export interface PriorityCriteria {
    complexity: number;
    impact: number;
    estimatedTime: number;
    deadline?: Date;
    dependencies: string[];
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
    tags: string[];
    priorityCriteria: PriorityCriteria;
    focusSessions: FocusSession[];
} 