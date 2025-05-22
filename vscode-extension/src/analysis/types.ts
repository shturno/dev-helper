export interface Insight {
    type: 'productivity' | 'efficiency' | 'completion' | 'streak';
    message: string;
    date: Date;
}

export interface ProductivityStats {
    bestTimeOfDay: string;
    mostProductiveDay: string;
    averageTaskDuration: number;
    completionRate: number;
    streak: number;
    totalTasks: number;
    completedTasks: number;
    totalFocusTime: number;
    averageFocusTime: number;
    productivityScore: number;
} 