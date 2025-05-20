import { TaskStatus } from '../tasks/tracker';

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

export interface UserData {
    id: number;
    level: number;
    xp_points: number;
    xp_for_next_level: number;
    title: string;
}

export interface ProductivityData {
    peakHours: Array<{
        start: string;
        end: string;
    }>;
    focusTime: {
        daily: number;
        weekly: number;
    };
    tasksCompleted: {
        daily: number;
        weekly: number;
    };
}

export declare class ApiClient {
    constructor(token?: string | null);
    authenticate(): Promise<UserData>;
    getUserTasks(): Promise<Task[]>;
    getActiveTask(): Promise<Task | null>;
    setActiveTask(taskId: number): Promise<void>;
    getSubtasks(taskId: number): Promise<Subtask[]>;
    decomposeTask(taskId: number): Promise<Subtask[]>;
    completeSubtask(subtaskId: number): Promise<{ xp_earned: number, all_completed: boolean }>;
    getUserProductivityData(): Promise<ProductivityData>;
    logFocusSession(data: { start_time: number, trigger: string, file_complexity?: number, file_name?: string }): Promise<void>;
    endFocusSession(data: { duration: number }): Promise<void>;
} 