// Logging types
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export interface LoggerConfig {
    logLevel: LogLevel;
    showNotifications: boolean;
    logToFile: boolean;
    logFilePath: string;
}

export interface LogMessage {
    timestamp: string;
    level: LogLevel;
    message: string;
    details?: unknown;
}

// Security types
export interface SecurityConfig {
    inputSanitization: boolean;
    dateValidation: boolean;
    maxTaskTitleLength: number;
    maxTaskDescriptionLength: number;
}

export interface ValidationResult<T> {
    isValid: boolean;
    value: T | null;
    errors: string[];
}

export interface WebviewMessage {
    type: 'update' | 'command' | 'error';
    taskIds?: number[];
    command?: string;
    data?: unknown;
    error?: string;
} 