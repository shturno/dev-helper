import * as vscode from 'vscode';
import { Task, TaskStatus } from '../tasks/types';
import { Insight } from '../types/analytics';

interface DailyStats {
    date: Date;
    focusTime: number;
    tasksCompleted: number;
    interruptions: number;
    taskCompletionRate: number;
}

interface MonthlyStats {
    month: Date;
    totalFocusTime: number;
    totalTasksCompleted: number;
    averageCompletionRate: number;
    bestDay?: Date;
}

export interface AnalysisStats {
    streak: number;
    mostProductiveHour: string;
    bestDay: string;
    dailyStats: DailyStats[];
    monthlyStats: MonthlyStats[];
    insights: Insight[];
}

export class AnalysisManager {
    private static instance: AnalysisManager;
    private context: vscode.ExtensionContext;
    private dailyStats: DailyStats[] = [];
    private monthlyStats: MonthlyStats[] = [];
    private insights: Insight[] = [];
    private disposables: vscode.Disposable[] = [];
    private stats: AnalysisStats = {
        streak: 0,
        mostProductiveHour: '--:--',
        bestDay: '--',
        dailyStats: [],
        monthlyStats: [],
        insights: []
    };

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadStats();
    }

    public static getInstance(context?: vscode.ExtensionContext): AnalysisManager {
        if (!AnalysisManager.instance) {
            if (!context) {
                throw new Error('Context is required for first initialization');
            }
            AnalysisManager.instance = new AnalysisManager(context);
        }
        return AnalysisManager.instance;
    }

    private loadStats(): void {
        if (this.context) {
            const savedStats = this.context.globalState.get<{
                dailyStats: Array<DailyStats & { date: string }>;
                monthlyStats: Array<MonthlyStats & { bestDay: string; worstDay: string }>;
                insights: Insight[];
            }>('dev-helper-analysis-stats');

            if (savedStats) {
                this.dailyStats = savedStats.dailyStats.map(stat => ({
                    ...stat,
                    date: new Date(stat.date)
                }));

                this.monthlyStats = savedStats.monthlyStats.map(stat => ({
                    ...stat,
                    bestDay: new Date(stat.bestDay),
                    worstDay: new Date(stat.worstDay)
                }));

                this.insights = savedStats.insights;
            }
        }
    }

    private async saveStats(): Promise<void> {
        const stats = {
            streak: this.stats.streak,
            mostProductiveHour: this.stats.mostProductiveHour,
            bestDay: this.stats.bestDay,
            dailyStats: this.dailyStats.map(stat => ({
                ...stat,
                date: stat.date.toISOString()
            })),
            monthlyStats: this.monthlyStats.map(stat => ({
                ...stat,
                month: stat.month.toISOString(),
                bestDay: stat.bestDay?.toISOString()
            })),
            insights: this.insights
        };

        await this.context.globalState.update('analysisStats', stats);
    }

    public async updateStats(tasks: Task[]): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        let todayStats = this.dailyStats.find(d => d.date.toISOString().split('T')[0] === today);

        if (!todayStats) {
            todayStats = {
                date: new Date(today),
                focusTime: 0,
                tasksCompleted: 0,
                interruptions: 0,
                taskCompletionRate: 0
            };
            this.dailyStats.push(todayStats);
        }

        // Atualizar métricas diárias
        const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
        if (todayStats) {
            todayStats.tasksCompleted = completedTasks.length;
            todayStats.focusTime = completedTasks.reduce((total, task) => {
                const focusTime = task.completedAt ? 
                    (task.completedAt.getTime() - task.createdAt.getTime()) / (1000 * 60) : 0;
                return total + focusTime;
            }, 0);
            todayStats.interruptions = tasks.filter(t => t.status === TaskStatus.INTERRUPTED).length;
            todayStats.taskCompletionRate = tasks.length > 0 ? 
                (completedTasks.length / tasks.length) : 0;
        }

        // Atualizar insights
        await this.updateInsights();

        // Atualizar estatísticas mensais
        await this.updateMonthlyStats();

        // Salvar estatísticas atualizadas
        await this.saveStats();
    }

    private async updateMonthlyStats(): Promise<void> {
        const now = new Date();
        const month = new Date(now.getFullYear(), now.getMonth(), 1);
        
        let monthlyStat = this.monthlyStats.find(m => 
            m.month.getFullYear() === month.getFullYear() &&
            m.month.getMonth() === month.getMonth()
        );

        if (!monthlyStat) {
            monthlyStat = {
                month,
                totalFocusTime: 0,
                totalTasksCompleted: 0,
                averageCompletionRate: 0
            };
            this.monthlyStats.push(monthlyStat);
        }

        const monthTasks = this.dailyStats.filter(d => 
            d.date.getFullYear() === month.getFullYear() &&
            d.date.getMonth() === month.getMonth()
        );

        if (monthlyStat) {
            monthlyStat.totalTasksCompleted = monthTasks.reduce((sum, d) => sum + d.tasksCompleted, 0);
            monthlyStat.totalFocusTime = monthTasks.reduce((sum, d) => sum + d.focusTime, 0);
            monthlyStat.averageCompletionRate = Math.round(
                monthTasks.reduce((sum, d) => sum + d.interruptions, 0) / monthTasks.length
            );

            // Encontrar melhor dia
            const sortedDays = [...monthTasks].sort((a, b) => b.focusTime - a.focusTime);
            if (sortedDays.length > 0) {
                monthlyStat.bestDay = sortedDays[0].date;
            }
        }

        await this.saveStats();
    }

    private async updateInsights(): Promise<void> {
        const newInsights: Insight[] = [];

        // Gerar insight de streak
        const streak = this.calculateStreak();
        if (streak > 0) {
            newInsights.push({
                type: 'streak',
                message: `Você manteve um streak de ${streak} dias! Continue assim!`,
                date: new Date()
            });
        }

        // Gerar insight de tempo de foco
        const focusTimeInsight = this.analyzeFocusTime();
        if (focusTimeInsight) {
            newInsights.push({
                type: 'focus_time',
                message: focusTimeInsight,
                date: new Date()
            });
        }

        // Gerar insight de eficiência
        const efficiencyInsight = this.analyzeEfficiency();
        if (efficiencyInsight) {
            newInsights.push({
                type: 'efficiency',
                message: efficiencyInsight,
                date: new Date()
            });
        }

        this.insights = newInsights;
        await this.saveStats();
    }

    private calculateStreak(): number {
        const today = new Date().toISOString().split('T')[0];
        const sortedDays = [...this.dailyStats]
            .sort((a, b) => b.date.getTime() - a.date.getTime());

        let streak = 0;
        const currentDate = new Date(today);

        for (const day of sortedDays) {
            const dayDate = day.date.toISOString().split('T')[0];
            const expectedDate = currentDate.toISOString().split('T')[0];

            if (dayDate === expectedDate && day.tasksCompleted > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    private analyzeFocusTime(): string | null {
        if (this.dailyStats.length === 0) return null;

        const recentStats = this.dailyStats.slice(-7);
        const avgFocusTime = recentStats.reduce((sum, stat) => sum + stat.focusTime, 0) / recentStats.length;

        if (avgFocusTime > 240) { // 4 horas
            return 'Excelente tempo de foco! Você está mantendo uma boa consistência.';
        } else if (avgFocusTime < 60) { // 1 hora
            return 'Seu tempo de foco está baixo. Que tal tentar a técnica Pomodoro?';
        }
        return null;
    }

    private analyzeEfficiency(): string | null {
        if (this.dailyStats.length === 0) return null;

        const recentStats = this.dailyStats.slice(-7);
        const avgCompletionRate = recentStats.reduce((sum, stat) => sum + stat.taskCompletionRate, 0) / recentStats.length;

        if (avgCompletionRate > 0.8) {
            return 'Sua taxa de conclusão de tarefas está excelente!';
        } else if (avgCompletionRate < 0.4) {
            return 'Sua taxa de conclusão está baixa. Considere dividir suas tarefas em partes menores.';
        }
        return null;
    }

    public showInsights(): void {
        const panel = vscode.window.createWebviewPanel(
            'productivityInsights',
            'Insights de Produtividade',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getInsightsContent();
    }

    private getInsightsContent(): string {
        const { insights } = this;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .insights-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .insights-title {
                        font-size: 2em;
                        margin: 0;
                        color: var(--vscode-textLink-foreground);
                    }
                    .insights-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .insight-card {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .insight-card h2 {
                        margin: 0 0 15px 0;
                        color: var(--vscode-textLink-foreground);
                    }
                    .pattern-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                    }
                    .pattern-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 10px;
                        background: var(--vscode-editor-background);
                        border-radius: 4px;
                    }
                    .pattern-value {
                        font-size: 1.2em;
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                    }
                    .pattern-label {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="insights-header">
                    <h1 class="insights-title">Insights de Produtividade</h1>
                </div>

                <div class="insights-grid">
                    ${insights.map(insight => `
                        <div class="insight-card">
                            <h2>${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}</h2>
                            <p>${insight.message}</p>
                            <p>Data: ${insight.date.toLocaleDateString()}</p>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;
    }

    public getStats(): AnalysisStats {
        return {
            streak: this.stats.streak,
            mostProductiveHour: this.stats.mostProductiveHour,
            bestDay: this.stats.bestDay,
            dailyStats: [...this.dailyStats],
            monthlyStats: [...this.monthlyStats],
            insights: [...this.insights]
        };
    }

    public getInsights(): Insight[] {
        return [...this.insights];
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
} 