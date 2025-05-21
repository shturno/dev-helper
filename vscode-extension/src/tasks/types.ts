import { TaskStatus } from './tracker';

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export interface PriorityCriteria {
    deadline?: Date;
    complexity: number; // 1-5
    impact: number; // 1-5
    dependencies: string[]; // IDs das tarefas dependentes
    estimatedTime: number; // em minutos
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

export interface Subtask {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    estimatedMinutes: number;
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