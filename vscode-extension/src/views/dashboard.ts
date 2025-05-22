import * as vscode from 'vscode';
import { TaskTracker } from '../tasks/tracker';
import { HyperfocusManager } from '../hyperfocus/manager';
import { AnalysisManager } from '../analysis/manager';
import { ProductivityStats } from '../types/analytics';
import { TaskStatus } from '../tasks/types';

export class DashboardView implements vscode.WebviewViewProvider {
    private static instance: DashboardView;
    private webviewView: vscode.WebviewView | undefined;
    private disposables: vscode.Disposable[] = [];

    private constructor(
        private taskTracker: TaskTracker,
        private hyperfocusManager: HyperfocusManager,
        private analysisManager: AnalysisManager
    ) {}

    public static getInstance(
        taskTracker: TaskTracker,
        hyperfocusManager: HyperfocusManager,
        analysisManager: AnalysisManager
    ): DashboardView {
        if (!DashboardView.instance) {
            DashboardView.instance = new DashboardView(taskTracker, hyperfocusManager, analysisManager);
        }
        return DashboardView.instance;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this.webviewView = webviewView;
        webviewView.webview.html = this.getWebviewContent();

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'startFocus':
                    if (this.hyperfocusManager.isActive) {
                        await this.hyperfocusManager.stopHyperfocus();
                    } else {
                        await this.hyperfocusManager.startHyperfocus();
                    }
                    this.update();
                    break;
                case 'createTask':
                    await this.taskTracker.createTask();
                    this.update();
                    break;
            }
        }, null, this.disposables);

        // Atualizar o dashboard periodicamente
        const updateInterval = setInterval(() => {
            this.update();
        }, 5000);

        this.disposables.push({ dispose: () => clearInterval(updateInterval) });
    }

    public update(): void {
        if (this.webviewView) {
            const stats = this.getStats();
            this.webviewView.webview.postMessage({ type: 'update', stats });
        }
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.webviewView = undefined;
    }

    private getStats(): ProductivityStats {
        const analysisStats = this.analysisManager.getStats();
        const hyperfocusStats = this.hyperfocusManager.getStats();
        const tasks = this.taskTracker.getTasks();
        const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);

        return {
            focusTime: hyperfocusStats.todayMinutes,
            streak: analysisStats.streak,
            tasksCompleted: completedTasks.length,
            completionRate: this.calculateCompletionRate(),
            mostProductiveHour: analysisStats.mostProductiveHour,
            bestDay: analysisStats.bestDay,
            avgTaskDuration: this.calculateAverageTaskDuration(),
            totalFocusTime: hyperfocusStats.totalMinutes,
            insights: analysisStats.insights
        };
    }

    private calculateCompletionRate(): number {
        const tasks = this.taskTracker.getTasks();
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        return Math.round((completedTasks / tasks.length) * 100);
    }

    private calculateAverageTaskDuration(): number {
        const tasks = this.taskTracker.getTasks().filter(t => t.status === TaskStatus.COMPLETED && t.actualTime);
        if (tasks.length === 0) return 0;
        const totalTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
        return Math.round(totalTime / tasks.length);
    }

    private getWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Dashboard de Produtividade</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        padding: 20px;
                        margin: 0;
                    }
                    .dashboard-container {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .stat-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 20px;
                    }
                    .stat-card h3 {
                        margin: 0 0 10px 0;
                        font-size: 14px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .stat-card p {
                        margin: 0;
                        font-size: 24px;
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                    }
                </style>
            </head>
            <body>
                <div class="dashboard-container">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Tempo Foco</h3>
                            <p id="focus-time">0 minutos</p>
                        </div>
                        <div class="stat-card">
                            <h3>Sequência</h3>
                            <p id="streak">0 dias</p>
                        </div>
                        <div class="stat-card">
                            <h3>Tarefas Concluídas</h3>
                            <p id="tasks-completed">0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Taxa de Conclusão</h3>
                            <p id="completion-rate">0%</p>
                        </div>
                        <div class="stat-card">
                            <h3>Hora Mais Produtiva</h3>
                            <p id="most-productive-hour">--:--</p>
                        </div>
                        <div class="stat-card">
                            <h3>Melhor Dia</h3>
                            <p id="best-day">--</p>
                        </div>
                        <div class="stat-card">
                            <h3>Duração Média</h3>
                            <p id="avg-task-duration">0 minutos</p>
                        </div>
                        <div class="stat-card">
                            <h3>Tempo Total Foco</h3>
                            <p id="total-focus-time">0 minutos</p>
                        </div>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'update':
                                if (message.stats) {
                                    const stats = message.stats;
                                    const elements = {
                                        focusTime: document.getElementById('focus-time'),
                                        streak: document.getElementById('streak'),
                                        tasksCompleted: document.getElementById('tasks-completed'),
                                        completionRate: document.getElementById('completion-rate'),
                                        mostProductiveHour: document.getElementById('most-productive-hour'),
                                        bestDay: document.getElementById('best-day'),
                                        avgTaskDuration: document.getElementById('avg-task-duration'),
                                        totalFocusTime: document.getElementById('total-focus-time')
                                    };

                                    if (elements.focusTime) elements.focusTime.textContent = \`\${stats.focusTime} minutos\`;
                                    if (elements.streak) elements.streak.textContent = \`\${stats.streak} dias\`;
                                    if (elements.tasksCompleted) elements.tasksCompleted.textContent = \`\${stats.tasksCompleted}\`;
                                    if (elements.completionRate) elements.completionRate.textContent = \`\${stats.completionRate}%\`;
                                    if (elements.mostProductiveHour) elements.mostProductiveHour.textContent = \`\${stats.mostProductiveHour}h\`;
                                    if (elements.bestDay) elements.bestDay.textContent = stats.bestDay;
                                    if (elements.avgTaskDuration) elements.avgTaskDuration.textContent = \`\${stats.avgTaskDuration} minutos\`;
                                    if (elements.totalFocusTime) elements.totalFocusTime.textContent = \`\${stats.totalFocusTime} minutos\`;
                                }
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
} 