/**
 * Utilitários de segurança para a extensão
 */

// Lista de caracteres HTML que precisam ser escapados
const HTML_ESCAPE_MAP: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

/**
 * Sanitiza uma string para uso seguro em HTML
 * Remove scripts e escapa caracteres HTML
 */
export function sanitizeHtml(str: string): string {
    if (!str) return '';
    
    // Remover scripts e tags HTML
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/<[^>]*>/g, '');
    
    // Escapar caracteres HTML
    return str.replace(/[&<>"'`=\/]/g, char => HTML_ESCAPE_MAP[char]);
}

/**
 * Valida se uma string contém apenas caracteres seguros
 */
export function isValidInput(str: string): boolean {
    // Permitir letras, números, espaços e alguns caracteres especiais comuns
    return /^[a-zA-Z0-9\s\-_.,!?()@#$%&*+=\[\]{}:;'"\/\\]+$/.test(str);
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