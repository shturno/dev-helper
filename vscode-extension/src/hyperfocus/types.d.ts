export interface HyperfocusContext {
    reason: 'manual' | 'complex_file' | 'peak_time';
    complexity?: number;
    fileName?: string;
}

export declare class HyperfocusManager {
    private constructor();
    static getInstance(context: vscode.ExtensionContext): HyperfocusManager;
    initialize(): Promise<void>;
    dispose(): void;
    isActive: boolean;
    activateHyperfocus(context: HyperfocusContext): Promise<void>;
    deactivateHyperfocus(): Promise<void>;
    getStats(): {
        todayMinutes: number;
        streak: number;
        totalMinutes: number;
        sessions: number;
        lastSessionDate: Date | null;
    };
} 