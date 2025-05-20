/**
 * Declarações de tipos para o módulo de segurança
 */

declare module './security' {
    export function sanitizeHtml(str: string): string;
    export function isValidInput(str: string): boolean;
    export function isValidTask(task: any): boolean;
    export function sanitizeTask(task: any): any;
    export function sanitizeForWebview(data: any): any;
}

export function generateSecureId(): string;
export function isValidSubtask(subtask: any): boolean; 