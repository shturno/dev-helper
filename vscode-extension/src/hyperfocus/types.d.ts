export interface HyperfocusContext {
    reason: 'manual' | 'complex_file' | 'peak_time';
    complexity?: number;
    fileName?: string;
}

export declare class HyperfocusManager {
    private constructor();
    static getInstance(): HyperfocusManager;
    initialize(): void;
    dispose(): void;
    isActive: boolean;
    activateHyperfocus(context: HyperfocusContext): Promise<void>;
    deactivateHyperfocus(): Promise<void>;
} 