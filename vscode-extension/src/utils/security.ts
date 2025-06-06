/**
 * Utilitários de segurança para a extensão
 */

import sanitizeHtmlLib from 'sanitize-html';
import { TaskStatus } from '../tasks/types';
import { Task, Subtask } from '../tasks/types';

interface SecurityConfig {
    maxInputLength: number;
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
    allowedIframeHostnames: string[];
}

interface ValidationResult {
    isValid: boolean;
    error?: string;
}

interface SanitizeResult {
    sanitized: string;
    removedTags: string[];
    removedAttributes: string[];
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    maxInputLength: 1000,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'code', 'pre'],
    allowedAttributes: {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title'],
        'code': ['class'],
        'pre': ['class']
    },
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
};

/**
 * Remove scripts and escapes HTML special characters for safe rendering.
 * @param input The input string to sanitize
 * @returns The sanitized string
 */
export function sanitizeHtml(input: string): string {
    // Primeiro, remover scripts para segurança
    const withoutScripts = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Escapar caracteres HTML
    return withoutScripts
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Verifica se a entrada contém apenas caracteres seguros.
 * @param str A string a ser validada
 * @returns true se a entrada for segura, false caso contrário
 */
export function isValidInput(str: string): boolean {
    // Não permite tags HTML
    if (/<.*?>/.test(str)) return false;
    // Permite apenas caracteres seguros (sem < >)
    const safeInputRegex = /^[a-zA-Z0-9\s\-_.!,?()[\]{}:;'"@#$%^&*+=/\\|~`]+$/;
    return safeInputRegex.test(str) && str.trim().length > 0;
}

/**
 * Gera um ID único e seguro
 */
export function generateSecureId(): string {
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

export interface SanitizedData {
    [key: string]: string | number | boolean | SanitizedData | SanitizedData[];
}

export function isValidTask(task: unknown): task is Task {
    if (!task || typeof task !== 'object') return false;

    const t = task as Task;
    return (
        typeof t.id === 'number' &&
        typeof t.title === 'string' &&
        t.title.length > 0 &&
        t.title.length <= 100 &&
        (!t.description || (typeof t.description === 'string' && t.description.length <= 500)) &&
        Object.values(TaskStatus).includes(t.status) &&
        typeof t.xpReward === 'number' &&
        Array.isArray(t.subtasks) &&
        t.subtasks.length <= 20 &&
        t.subtasks.every(isValidSubtask) &&
        t.createdAt instanceof Date &&
        t.updatedAt instanceof Date
    );
}

export function isValidSubtask(subtask: unknown): subtask is Subtask {
    if (!subtask || typeof subtask !== 'object') return false;

    const s = subtask as Subtask;
    return (
        typeof s.id === 'number' &&
        typeof s.title === 'string' &&
        s.title.length > 0 &&
        typeof s.estimatedMinutes === 'number' &&
        s.estimatedMinutes >= 0 &&
        s.estimatedMinutes <= 480 &&
        typeof s.status === 'string' &&
        s.status === TaskStatus.COMPLETED
    );
}

export function sanitizeTask(task: unknown): Task | null {
    if (!task || typeof task !== 'object') return null;

    const t = task as Task;
    return {
        ...t,
        title: sanitizeHtml(t.title || ''),
        description: t.description ? sanitizeHtml(t.description) : '',
        subtasks: (t.subtasks || []).map((subtask: Subtask) => ({
            ...subtask,
            title: sanitizeHtml(subtask.title || '')
        }))
    };
}

/**
 * Sanitiza texto para uso seguro em webview
 * @param text Texto a ser sanitizado
 * @returns Texto sanitizado
 */
export function sanitizeForWebview(text: string | undefined | null): string {
    if (!text) return '';
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
}

/**
 * Sanitiza a entrada do usuário e retorna informações sobre o que foi removido.
 * @param input A string de entrada a ser sanitizada
 * @param config Configuração opcional de segurança
 * @returns Objeto contendo a string sanitizada e informações sobre o que foi removido
 */
export function sanitizeUserInput(input: string, config: Partial<SecurityConfig> = {}): SanitizeResult {
    const mergedConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };
    const sanitizeOptions: sanitizeHtmlLib.IOptions = {
        allowedTags: mergedConfig.allowedTags,
        allowedAttributes: mergedConfig.allowedAttributes,
        allowedIframeHostnames: mergedConfig.allowedIframeHostnames
    };

    const sanitized = sanitizeHtmlLib(input.trim(), sanitizeOptions);
    const removedTags: string[] = [];
    const removedAttributes: string[] = [];

    // Detectar tags removidas
    const originalTags = input.match(/<[^>]+>/g) || [];
    const sanitizedTags = sanitized.match(/<[^>]+>/g) || [];
    
    // Verificar cada tag original
    for (let i = 0; i < originalTags.length; i++) {
        const tag = originalTags[i];
        const isTagPresent = sanitizedTags.some((sanitizedTag: string) => sanitizedTag === tag);
        if (!isTagPresent) {
            const tagName = tag.match(/<([a-z0-9]+)/i)?.[1];
            if (tagName) removedTags.push(tagName);
        }
    }

    // Detectar atributos removidos
    originalTags.forEach(tag => {
        const attrMatches = tag.match(/\s([a-z0-9-]+)=["'][^"']*["']/gi) || [];
        attrMatches.forEach(attr => {
            const attrName = attr.match(/\s([a-z0-9-]+)=/i)?.[1];
            if (attrName && !sanitizedTags.some(t => t.includes(`${attrName}=`))) {
                removedAttributes.push(attrName);
            }
        });
    });

    return {
        sanitized,
        removedTags: [...new Set(removedTags)],
        removedAttributes: [...new Set(removedAttributes)]
    };
}

/**
 * Valida a entrada do usuário e retorna um resultado com informações sobre a validação.
 * @param input A string de entrada a ser validada
 * @param config Configuração opcional de segurança
 * @returns Objeto contendo o resultado da validação e mensagem de erro, se houver
 */
export function validateUserInput(input: string, config: Partial<SecurityConfig> = {}): ValidationResult {
    const mergedConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };

    if (!input || typeof input !== 'string') {
        return { isValid: false, error: 'Entrada inválida' };
    }

    if (input.length > mergedConfig.maxInputLength) {
        return {
            isValid: false,
            error: `Entrada muito longa. Máximo de ${mergedConfig.maxInputLength} caracteres permitido.`
        };
    }

    if (!isValidInput(input)) {
        return {
            isValid: false,
            error: 'Entrada contém caracteres não permitidos'
        };
    }

    const { removedTags, removedAttributes } = sanitizeUserInput(input, mergedConfig);
    if (removedTags.length > 0 || removedAttributes.length > 0) {
        const errorParts = [];
        if (removedTags.length > 0) {
            errorParts.push(`tags (${removedTags.join(', ')})`);
        }
        if (removedAttributes.length > 0) {
            errorParts.push(`atributos (${removedAttributes.join(', ')})`);
        }
        const errorMessage = errorParts.length > 0 ? `Conteúdo inseguro removido: ${errorParts.join(', ')}` : '';
        return {
            isValid: false,
            error: errorMessage
        };
    }

    return { isValid: true };
}

/**
 * Valida e sanitiza um número
 * @param value Valor a ser validado
 * @param min Valor mínimo permitido
 * @param max Valor máximo permitido
 * @param defaultValue Valor padrão caso inválido
 * @returns Número validado
 */
export function validateNumber(value: unknown, min: number, max: number, defaultValue: number): number {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
        return defaultValue;
    }
    return num;
}

/**
 * Valida e sanitiza uma data
 * @param date Data a ser validada
 * @returns Data validada ou null se inválida
 */
export function validateDate(date: unknown): Date | null {
    if (!date) return null;
    
    try {
        const parsedDate = new Date(date as string);
        if (isNaN(parsedDate.getTime())) {
            return null;
        }
        return parsedDate;
    } catch {
        return null;
    }
}

/**
 * Valida e sanitiza um objeto de tarefa
 * @param task Objeto de tarefa a ser validado
 * @returns Objeto de tarefa validado ou null se inválido
 */
export function validateTask(task: unknown): any {
    if (!task || typeof task !== 'object') return null;
    
    const validatedTask = {
        id: validateNumber((task as any).id, 0, Number.MAX_SAFE_INTEGER, 0),
        title: sanitizeForWebview((task as any).title),
        description: sanitizeForWebview((task as any).description),
        status: (task as any).status || 'NOT_STARTED',
        priority: (task as any).priority || 'MEDIUM',
        priorityCriteria: {
            complexity: validateNumber((task as any).priorityCriteria?.complexity, 1, 5, 3),
            impact: validateNumber((task as any).priorityCriteria?.impact, 1, 5, 3),
            estimatedTime: validateNumber((task as any).priorityCriteria?.estimatedTime, 0, 1440, 30),
            deadline: validateDate((task as any).priorityCriteria?.deadline)
        },
        createdAt: validateDate((task as any).createdAt),
        completedAt: validateDate((task as any).completedAt)
    };

    return validatedTask;
}

/**
 * Valida e sanitiza uma mensagem do webview
 * @param message Mensagem a ser validada
 * @returns Mensagem validada ou null se inválida
 */
export function validateWebviewMessage(message: unknown): any {
    if (!message || typeof message !== 'object') return null;
    
    const msg = message as any;
    if (msg.type !== 'update') return null;

    return {
        type: msg.type,
        tasks: Array.isArray(msg.tasks) ? msg.tasks.map(validateTask).filter(Boolean) : [],
        hyperfocus: {
            todayMinutes: validateNumber(msg.hyperfocus?.todayMinutes, 0, 1440, 0),
            isActive: Boolean(msg.hyperfocus?.isActive)
        },
        productivity: {
            dailyStats: Array.isArray(msg.productivity?.dailyStats) 
                ? msg.productivity.dailyStats.map((stat: any) => ({
                    tasksCompleted: validateNumber(stat.tasksCompleted, 0, 1000, 0),
                    taskCompletionRate: validateNumber(stat.taskCompletionRate, 0, 1, 0),
                    mostProductiveHour: validateNumber(stat.mostProductiveHour, 0, 23, 0),
                    averageTaskDuration: validateNumber(stat.averageTaskDuration, 0, 1440, 0),
                    totalFocusTime: validateNumber(stat.totalFocusTime, 0, 1440, 0)
                }))
                : [],
            monthlyStats: Array.isArray(msg.productivity?.monthlyStats)
                ? msg.productivity.monthlyStats.map((stat: any) => ({
                    bestDay: validateDate(stat.bestDay),
                    totalFocusTime: validateNumber(stat.totalFocusTime, 0, 43200, 0)
                }))
                : [],
            insights: Array.isArray(msg.productivity?.insights)
                ? msg.productivity.insights.map((insight: any) => ({
                    type: ['productivity_trend', 'streak', 'focus_time', 'efficiency'].includes(insight.type)
                        ? insight.type
                        : 'productivity_trend',
                    message: sanitizeForWebview(insight.message),
                    date: validateDate(insight.date)
                }))
                : []
        }
    };
} 