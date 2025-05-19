import * as vscode from 'vscode';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    xpReward: number;
    subtasks: Subtask[];
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

export class ApiClient {
    private baseUrl: string;
    private token: string | null;

    constructor(token: string | null = null) {
        const config = vscode.workspace.getConfiguration('tdahDevHelper');
        this.baseUrl = config.get('apiUrl', 'http://localhost:8000/api');
        this.token = token;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Métodos de autenticação
    public async authenticate(): Promise<UserData> {
        return this.request<UserData>('/auth/user');
    }

    // Métodos de tarefas
    public async getUserTasks(): Promise<Task[]> {
        return this.request<Task[]>('/tasks');
    }

    public async getActiveTask(): Promise<Task | null> {
        return this.request<Task | null>('/vscode/user-tasks/active');
    }

    public async setActiveTask(taskId: number): Promise<void> {
        return this.request<void>('/vscode/user-tasks/active', {
            method: 'POST',
            body: JSON.stringify({ task_id: taskId })
        });
    }

    public async getSubtasks(taskId: number): Promise<Subtask[]> {
        return this.request<Subtask[]>(`/tasks/${taskId}/subtasks`);
    }

    public async decomposeTask(taskId: number): Promise<Subtask[]> {
        return this.request<Subtask[]>(`/tasks/${taskId}/decompose`, {
            method: 'POST'
        });
    }

    public async completeSubtask(subtaskId: number): Promise<{ xp_earned: number, all_completed: boolean }> {
        return this.request<{ xp_earned: number, all_completed: boolean }>(
            `/subtasks/${subtaskId}/complete`,
            { method: 'PUT' }
        );
    }

    // Métodos de produtividade
    public async getUserProductivityData(): Promise<ProductivityData> {
        return this.request<ProductivityData>('/users/productivity/peak-hours');
    }

    // Métodos de hiperfoco
    public async logFocusSession(data: { start_time: number, trigger: string, file_complexity?: number, file_name?: string }): Promise<void> {
        return this.request<void>('/vscode/activity-log', {
            method: 'POST',
            body: JSON.stringify({
                type: 'focus_session_start',
                data
            })
        });
    }

    public async endFocusSession(data: { duration: number }): Promise<void> {
        return this.request<void>('/vscode/activity-log', {
            method: 'POST',
            body: JSON.stringify({
                type: 'focus_session_end',
                data
            })
        });
    }
} 