/**
 * Utilitários de segurança para a extensão
 */

import sanitizeHtmlLib from 'sanitize-html';

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
    // Remove tags perigosas e retorna texto seguro
    return sanitizeHtmlLib(input, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: 'discard'
    });
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

/**
 * Valida se um objeto é uma tarefa válida
 */
export function isValidTask(task: any): boolean {
    return (
        task &&
        typeof task === 'object' &&
        typeof task.id === 'number' &&
        typeof task.title === 'string' &&
        task.title.length > 0 &&
        task.title.length <= 100 &&
        (!task.description || typeof task.description === 'string') &&
        task.description?.length <= 500 &&
        Array.isArray(task.subtasks) &&
        task.subtasks.length <= 20 &&
        task.subtasks.every(isValidSubtask)
    );
}

/**
 * Valida se um objeto é uma subtarefa válida
 */
export function isValidSubtask(subtask: any): boolean {
    return (
        subtask &&
        typeof subtask === 'object' &&
        typeof subtask.id === 'number' &&
        typeof subtask.taskId === 'number' &&
        typeof subtask.title === 'string' &&
        subtask.title.length > 0 &&
        typeof subtask.estimatedMinutes === 'number' &&
        subtask.estimatedMinutes >= 0 &&
        subtask.estimatedMinutes <= 480 &&
        typeof subtask.completed === 'boolean'
    );
}

/**
 * Sanitiza um objeto de tarefa antes de salvar
 */
export function sanitizeTask(task: any): any {
    if (!task) return null;

    return {
        ...task,
        title: sanitizeHtml(task.title || ''),
        description: task.description ? sanitizeHtml(task.description) : '',
        subtasks: (task.subtasks || []).map((subtask: any) => ({
            ...subtask,
            title: sanitizeHtml(subtask.title || '')
        }))
    };
}

/**
 * Sanitiza dados antes de enviar para o webview
 */
export function sanitizeForWebview(data: any): any {
    if (Array.isArray(data)) {
        return data.map(sanitizeForWebview);
    }
    
    if (data && typeof data === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
            // Remover dados sensíveis
            if (['createdBy', 'machineId', 'token'].includes(key)) {
                continue;
            }
            sanitized[key] = sanitizeForWebview(value);
        }
        return sanitized;
    }
    
    if (typeof data === 'string') {
        return sanitizeHtml(data);
    }
    
    return data;
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