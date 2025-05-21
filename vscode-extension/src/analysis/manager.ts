import * as vscode from 'vscode';
import { Task } from '../tasks/types';

export interface ProductivityStats {
    dailyStats: {
        date: string;
        focusTime: number;
        tasksCompleted: number;
        averageTaskTime: number;
    }[];
    weeklyStats: {
        weekStart: string;
        totalFocusTime: number;
        totalTasks: number;
        completionRate: number;
        averageSessionLength: number;
    }[];
    monthlyStats: {
        month: string;
        totalFocusTime: number;
        totalTasks: number;
        bestDay: string;
        bestDayFocusTime: number;
    }[];
    insights: {
        bestTimeOfDay: string;
        mostProductiveDay: string;
        averageTaskDuration: number;
        completionRate: number;
        streak: number;
    };
}

export class AnalysisManager {
    private static instance: AnalysisManager;
    private config: vscode.WorkspaceConfiguration;
    private stats: ProductivityStats;

    private constructor() {
        this.config = vscode.workspace.getConfiguration('tdahDevHelper');
        this.stats = this.loadStats();
    }

    public static getInstance(): AnalysisManager {
        if (!AnalysisManager.instance) {
            AnalysisManager.instance = new AnalysisManager();
        }
        return AnalysisManager.instance;
    }

    private loadStats(): ProductivityStats {
        try {
            return this.config.get('productivityStats', {
                dailyStats: [],
                weeklyStats: [],
                monthlyStats: [],
                insights: {
                    bestTimeOfDay: '',
                    mostProductiveDay: '',
                    averageTaskDuration: 0,
                    completionRate: 0,
                    streak: 0
                }
            });
        } catch (error) {
            console.error('Erro ao carregar estatísticas de produtividade:', error);
            return {
                dailyStats: [],
                weeklyStats: [],
                monthlyStats: [],
                insights: {
                    bestTimeOfDay: '',
                    mostProductiveDay: '',
                    averageTaskDuration: 0,
                    completionRate: 0,
                    streak: 0
                }
            };
        }
    }

    private async saveStats(): Promise<void> {
        try {
            await this.config.update('productivityStats', this.stats, true);
        } catch (error) {
            console.error('Erro ao salvar estatísticas de produtividade:', error);
        }
    }

    public async updateStats(focusTime: number, tasks: Task[]): Promise<void> {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const weekStart = this.getWeekStart(today);
        const monthStr = today.toISOString().slice(0, 7);

        // Atualizar estatísticas diárias
        const dailyStat = this.stats.dailyStats.find(s => s.date === todayStr) || {
            date: todayStr,
            focusTime: 0,
            tasksCompleted: 0,
            averageTaskTime: 0
        };

        dailyStat.focusTime += focusTime;
        const completedTasks = tasks.filter(t => t.status === 'completed');
        dailyStat.tasksCompleted = completedTasks.length;
        dailyStat.averageTaskTime = dailyStat.focusTime / (dailyStat.tasksCompleted || 1);

        if (!this.stats.dailyStats.find(s => s.date === todayStr)) {
            this.stats.dailyStats.push(dailyStat);
        }

        // Atualizar estatísticas semanais
        const weeklyStat = this.stats.weeklyStats.find(s => s.weekStart === weekStart) || {
            weekStart,
            totalFocusTime: 0,
            totalTasks: 0,
            completionRate: 0,
            averageSessionLength: 0
        };

        weeklyStat.totalFocusTime += focusTime;
        weeklyStat.totalTasks = tasks.length;
        weeklyStat.completionRate = (completedTasks.length / tasks.length) * 100;
        weeklyStat.averageSessionLength = weeklyStat.totalFocusTime / (this.stats.dailyStats.filter(s => s.date.startsWith(weekStart)).length || 1);

        if (!this.stats.weeklyStats.find(s => s.weekStart === weekStart)) {
            this.stats.weeklyStats.push(weeklyStat);
        }

        // Atualizar estatísticas mensais
        const monthlyStat = this.stats.monthlyStats.find(s => s.month === monthStr) || {
            month: monthStr,
            totalFocusTime: 0,
            totalTasks: 0,
            bestDay: '',
            bestDayFocusTime: 0
        };

        monthlyStat.totalFocusTime += focusTime;
        monthlyStat.totalTasks = tasks.length;

        // Atualizar melhor dia do mês
        const monthDays = this.stats.dailyStats.filter(s => s.date.startsWith(monthStr));
        const bestDay = monthDays.reduce((best, current) => 
            current.focusTime > best.focusTime ? current : best
        , { date: '', focusTime: 0 });

        monthlyStat.bestDay = bestDay.date;
        monthlyStat.bestDayFocusTime = bestDay.focusTime;

        if (!this.stats.monthlyStats.find(s => s.month === monthStr)) {
            this.stats.monthlyStats.push(monthlyStat);
        }

        // Atualizar insights
        this.updateInsights();

        // Salvar estatísticas
        await this.saveStats();
    }

    private updateInsights(): void {
        const last30Days = this.stats.dailyStats.slice(-30);
        if (last30Days.length === 0) return;

        // Melhor horário do dia
        const hourlyStats = new Array(24).fill(0);
        last30Days.forEach(day => {
            // Aqui você pode adicionar lógica para analisar horários específicos
            // Por enquanto, vamos usar uma distribuição simples
            const hour = Math.floor(Math.random() * 24); // Simulado
            hourlyStats[hour] += day.focusTime;
        });
        const bestHour = hourlyStats.indexOf(Math.max(...hourlyStats));
        this.stats.insights.bestTimeOfDay = `${bestHour}:00`;

        // Dia mais produtivo
        const mostProductiveDay = last30Days.reduce((best, current) => 
            current.focusTime > best.focusTime ? current : best
        , { date: '', focusTime: 0 });
        this.stats.insights.mostProductiveDay = mostProductiveDay.date;

        // Duração média das tarefas
        const totalTaskTime = last30Days.reduce((sum, day) => sum + day.focusTime, 0);
        const totalTasks = last30Days.reduce((sum, day) => sum + day.tasksCompleted, 0);
        this.stats.insights.averageTaskDuration = totalTaskTime / (totalTasks || 1);

        // Taxa de conclusão
        const totalTasksStarted = last30Days.reduce((sum, day) => sum + day.tasksCompleted, 0);
        const totalTasksCompleted = last30Days.reduce((sum, day) => sum + day.tasksCompleted, 0);
        this.stats.insights.completionRate = (totalTasksCompleted / (totalTasksStarted || 1)) * 100;

        // Sequência de dias produtivos
        let currentStreak = 0;
        let maxStreak = 0;
        for (let i = last30Days.length - 1; i >= 0; i--) {
            if (last30Days[i].focusTime > 0) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        this.stats.insights.streak = maxStreak;
    }

    private getWeekStart(date: Date): string {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return d.toISOString().split('T')[0];
    }

    public getStats(): ProductivityStats {
        return { ...this.stats };
    }
} 