import * as vscode from 'vscode';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

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

export interface ApiConfig {
    baseUrl: string;
    timeout?: number;
}

export class ApiClient {
    private client: AxiosInstance;
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('tdahDevHelper');
        const baseUrl = this.config.get<string>('apiUrl') || 'http://localhost:3000';
        
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    private async request<T>(config: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.request<T>(config);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.message || error.message;
                throw new Error(`API Error: ${message}`);
            }
            throw error;
        }
    }

    public async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        return this.request<T>({
            method: 'GET',
            url: endpoint,
            params
        });
    }

    public async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>({
            method: 'POST',
            url: endpoint,
            data
        });
    }

    public async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>({
            method: 'PUT',
            url: endpoint,
            data
        });
    }

    public async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>({
            method: 'DELETE',
            url: endpoint
        });
    }

    // Métodos específicos da API
    public async getActiveTask(): Promise<any> {
        return this.get('/tasks/active');
    }

    public async setActiveTask(taskId: number): Promise<any> {
        return this.put('/tasks/active', { taskId });
    }

    public async createTask(task: any): Promise<any> {
        return this.post('/tasks', task);
    }

    public async updateTask(id: string, task: any): Promise<any> {
        return this.put(`/tasks/${id}`, task);
    }

    public async deleteTask(id: string): Promise<void> {
        return this.delete(`/tasks/${id}`);
    }

    public async getTasks(): Promise<any[]> {
        return this.get('/tasks');
    }

    public async getUserProfile(): Promise<any> {
        return this.get('/user/profile');
    }

    public async updateUserProfile(profile: any): Promise<any> {
        return this.put('/user/profile', profile);
    }

    // Métodos de autenticação
    public async authenticate(): Promise<UserData> {
        return this.get<UserData>('/auth/user');
    }

    // Métodos de tarefas
    public async getUserTasks(): Promise<Task[]> {
        return this.get<Task[]>('/tasks');
    }

    public async getSubtasks(taskId: number): Promise<Subtask[]> {
        return this.get<Subtask[]>(`/tasks/${taskId}/subtasks`);
    }

    public async decomposeTask(taskId: number): Promise<Subtask[]> {
        return this.post<Subtask[]>(`/tasks/${taskId}/decompose`);
    }

    public async completeSubtask(subtaskId: number): Promise<{ xp_earned: number, all_completed: boolean }> {
        return this.put<{ xp_earned: number, all_completed: boolean }>(`/subtasks/${subtaskId}/complete`);
    }

    // Métodos de produtividade
    public async getUserProductivityData(): Promise<ProductivityData> {
        return this.get<ProductivityData>('/users/productivity/peak-hours');
    }

    // Métodos de hiperfoco
    public async logFocusSession(data: { start_time: number, trigger: string, file_complexity?: number, file_name?: string }): Promise<void> {
        return this.post('/vscode/activity-log', {
            type: 'focus_session_start',
            data
        });
    }

    public async endFocusSession(data: { duration: number }): Promise<void> {
        return this.post('/vscode/activity-log', {
            type: 'focus_session_end',
            data
        });
    }
} 