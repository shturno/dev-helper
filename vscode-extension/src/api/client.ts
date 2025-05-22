import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Task as ApiTask, Subtask as ApiSubtask } from './types';
import { TaskStatus } from '../tasks/types';
import { Task, Subtask, TaskUpdateData } from '../tasks/types';

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

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
}

export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    preferences?: Record<string, unknown>;
}

export class ApiClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || 'https://api.tdah-dev-helper.com/v1';
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    private async request<T>(config: AxiosRequestConfig): Promise<T> {
        try {
            const response = await this.client.request<ApiResponse<T>>(config);
            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const apiError = error.response?.data as ApiError;
                throw new Error(`API Error: ${apiError?.message || error.message}`);
            }
            throw error;
        }
    }

    public async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
        return this.request<T>({
            method: 'GET',
            url: endpoint,
            params
        });
    }

    public async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
        return this.request<T>({
            method: 'POST',
            url: endpoint,
            data
        });
    }

    public async put<T, D extends Record<string, unknown>>(endpoint: string, data: D): Promise<T> {
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
    public async getActiveTask(): Promise<ApiTask> {
        return this.get<ApiTask>('/tasks/active');
    }

    public async setActiveTask(taskId: number): Promise<ApiTask> {
        return this.put<ApiTask, { taskId: number }>('/tasks/active', { taskId });
    }

    public async createTask(task: Omit<ApiTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiTask> {
        const response = await fetch(`${this.baseUrl}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...task,
                status: TaskStatus.PENDING
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao criar tarefa na API');
        }

        const data = await response.json() as ApiTask;
        if (!this.isValidTask(data)) {
            throw new Error('Resposta inválida da API');
        }

        return data;
    }

    public async updateTask(id: string, task: TaskUpdateData): Promise<ApiTask> {
        return this.put<ApiTask, TaskUpdateData>(`/tasks/${id}`, task);
    }

    public async deleteTask(id: string): Promise<void> {
        return this.delete<void>(`/tasks/${id}`);
    }

    public async getTasks(): Promise<ApiTask[]> {
        return this.get<ApiTask[]>('/tasks');
    }

    public async getUserProfile(): Promise<UserProfile> {
        return this.get<UserProfile>('/user/profile');
    }

    public async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
        return this.put<UserProfile, Partial<UserProfile>>('/user/profile', profile);
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

    public async completeSubtask(subtaskId: number): Promise<{ xp_earned: number; all_completed: boolean }> {
        return this.put<{ xp_earned: number; all_completed: boolean }, { subtaskId: number }>(
            `/subtasks/${subtaskId}/complete`,
            { subtaskId }
        );
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

    async updateTaskStatus(taskId: number, status: TaskStatus): Promise<ApiTask> {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar status da tarefa na API');
        }

        const data = await response.json();
        if (!this.isValidTask(data)) {
            throw new Error('Resposta inválida da API');
        }

        return data;
    }

    private isValidTask(data: unknown): data is ApiTask {
        if (!data || typeof data !== 'object') return false;

        const task = data as ApiTask;
        return (
            typeof task.id === 'number' &&
            typeof task.title === 'string' &&
            (!task.description || typeof task.description === 'string') &&
            Object.values(TaskStatus).includes(task.status) &&
            typeof task.xpReward === 'number' &&
            Array.isArray(task.subtasks) &&
            task.subtasks.every(this.isValidSubtask) &&
            task.createdAt instanceof Date &&
            task.updatedAt instanceof Date
        );
    }

    private isValidSubtask(data: unknown): data is ApiSubtask {
        if (!data || typeof data !== 'object') return false;

        const subtask = data as ApiSubtask;
        return (
            typeof subtask.id === 'number' &&
            typeof subtask.taskId === 'number' &&
            typeof subtask.title === 'string' &&
            typeof subtask.estimatedMinutes === 'number' &&
            typeof subtask.completed === 'boolean'
        );
    }

    public async getProductivityHours(): Promise<boolean> {
        try {
            const response = await this.client.get<{ isProductiveHour: boolean }>('/productivity/hours');
            return response.data.isProductiveHour;
        } catch (error) {
            console.error('Erro ao verificar horário produtivo:', error);
            return false;
        }
    }

    public dispose(): void {
        // Limpar recursos se necessário
    }
} 