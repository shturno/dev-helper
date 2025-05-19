import { ApiClient, Task, Subtask } from '../api/types';

export declare class TaskTracker {
    constructor(apiClient: ApiClient);
    initialize(): void;
    dispose(): void;
    selectTask(): Promise<void>;
    decomposeCurrentTask(): Promise<void>;
    showDashboard(): void;
} 