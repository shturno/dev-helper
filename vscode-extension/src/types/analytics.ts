export interface Insight {
    type: 'streak' | 'focus_time' | 'efficiency' | 'productivity' | 'interruption';
    message: string;
    date: Date;
    severity?: 'info' | 'warning' | 'success';
    data?: Record<string, unknown>;
}

export interface ProductivityStats {
    focusTime: number;
    streak: number;
    tasksCompleted: number;
    completionRate: number;
    mostProductiveHour: string;
    bestDay: string;
    avgTaskDuration: number;
    totalFocusTime: number;
    insights: Insight[];
}

export interface AnalyticsConfig {
    enabled: boolean;
    trackFocusTime: boolean;
    trackInterruptions: boolean;
    trackTaskCompletion: boolean;
    insightsEnabled: boolean;
    dataRetentionDays: number;
    autoExportEnabled: boolean;
    exportFormat: 'json' | 'csv';
    exportPath?: string;
}

export interface DailyAnalytics {
    date: Date;
    focusTime: number;
    tasksCompleted: number;
    interruptions: number;
    completionRate: number;
    insights: Insight[];
}

export interface MonthlyAnalytics {
    month: Date;
    totalFocusTime: number;
    totalTasksCompleted: number;
    averageCompletionRate: number;
    bestDay?: Date;
    insights: Insight[];
}

export interface AnalyticsData {
    dailyStats: DailyAnalytics[];
    monthlyStats: MonthlyAnalytics[];
    insights: Insight[];
    config: AnalyticsConfig;
    lastUpdated: Date;
} 