import { TaskStatus } from './tracker';

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    xpReward: number;
    subtasks: Subtask[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Subtask {
    id: number;
    taskId: number;
    title: string;
    estimatedMinutes: number;
    completed: boolean;
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