import * as vscode from 'vscode';
import { TaskTracker } from '../tasks/tracker';
import { HyperfocusManager } from '../hyperfocus/manager';
import { AnalysisManager } from '../analysis/manager';

export class DashboardView {
    private static instance: DashboardView;
    private panel: vscode.WebviewPanel | vscode.WebviewView | undefined;
    private taskTracker: TaskTracker;
    private hyperfocusManager: HyperfocusManager;
    private analysisManager: AnalysisManager;

    private constructor(context: vscode.ExtensionContext) {
        this.taskTracker = TaskTracker.getInstance(context);
        this.hyperfocusManager = HyperfocusManager.getInstance();
        this.analysisManager = AnalysisManager.getInstance();
    }

    public static getInstance(context: vscode.ExtensionContext): DashboardView {
        if (!DashboardView.instance) {
            DashboardView.instance = new DashboardView(context);
        }
        return DashboardView.instance;
    }

    private formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    private getWebviewContent(): string {
        const tasks = this.taskTracker.getTasks();
        const hyperfocusStats = this.hyperfocusManager.getStats();
        const productivityStats = this.analysisManager.getStats();

        const taskListHtml = tasks.map(task => {
            const subtasksHtml = task.subtasks.length > 0
                ? `<div class="subtasks">
                    ${task.subtasks.map(subtask => 
                        `<div class="subtask ${subtask.completed ? 'completed' : ''}">
                            <span class="subtask-title">${subtask.title}</span>
                            <span class="subtask-time">${this.formatTime(subtask.estimatedMinutes)}</span>
                        </div>`
                    ).join('')}
                </div>`
                : '';

            return `<div class="task-item ${task.status}">
                <div class="task-header">
                    <h3>${task.title}</h3>
                    <span class="task-status">${task.status}</span>
                </div>
                <p class="task-description">${task.description || ''}</p>
                ${subtasksHtml}
            </div>`;
        }).join('');

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Dashboard TDAH Dev Helper</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        padding: 1rem;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 2rem;
                    }
                    .actions {
                        display: flex;
                        gap: 1rem;
                    }
                    .button {
                        padding: 0.5rem 1rem;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 0.875rem;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    .button.primary {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }
                    .analytics-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 1rem;
                        margin: 1rem 0;
                    }
                    .analytics-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 1rem;
                    }
                    .analytics-card h3 {
                        margin: 0 0 0.5rem 0;
                        font-size: 1rem;
                    }
                    .analytics-value {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                    }
                    .analytics-label {
                        font-size: 0.875rem;
                        color: var(--vscode-descriptionForeground);
                    }
                    .insights-section {
                        margin-top: 2rem;
                        padding: 1rem;
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                    }
                    .insights-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 1rem;
                        margin-top: 1rem;
                    }
                    .insight-item {
                        padding: 0.5rem;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                    }
                    .insight-label {
                        font-size: 0.875rem;
                        color: var(--vscode-descriptionForeground);
                    }
                    .insight-value {
                        font-size: 1.125rem;
                        color: var(--vscode-textLink-foreground);
                        margin-top: 0.25rem;
                    }
                    .task-list {
                        margin-top: 2rem;
                    }
                    .task-item {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 1rem;
                        margin-bottom: 1rem;
                    }
                    .task-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 0.5rem;
                    }
                    .task-header h3 {
                        margin: 0;
                        font-size: 1rem;
                    }
                    .task-status {
                        font-size: 0.875rem;
                        padding: 0.25rem 0.5rem;
                        border-radius: 4px;
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                    }
                    .task-description {
                        margin: 0.5rem 0;
                        font-size: 0.875rem;
                        color: var(--vscode-descriptionForeground);
                    }
                    .subtasks {
                        margin-top: 0.5rem;
                        padding-top: 0.5rem;
                        border-top: 1px solid var(--vscode-panel-border);
                    }
                    .subtask {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.25rem 0;
                        font-size: 0.875rem;
                    }
                    .subtask.completed {
                        color: var(--vscode-descriptionForeground);
                        text-decoration: line-through;
                    }
                    .subtask-time {
                        color: var(--vscode-descriptionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Dashboard TDAH Dev Helper</h1>
                        <div class="actions">
                            <button id="startHyperfocus" class="button primary">
                                ${this.hyperfocusManager.isActive ? 'Parar Hiperfoco' : 'Iniciar Hiperfoco'}
                            </button>
                            <button id="createTask" class="button">Criar Tarefa</button>
                        </div>
                    </div>

                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <h3>Tempo em Foco Hoje</h3>
                            <div class="analytics-value">${this.formatTime(hyperfocusStats.todayMinutes)}</div>
                            <div class="analytics-label">Minutos de foco hoje</div>
                        </div>
                        <div class="analytics-card">
                            <h3>Dias Consecutivos</h3>
                            <div class="analytics-value">${productivityStats.insights.streak}</div>
                            <div class="analytics-label">Dias produtivos seguidos</div>
                        </div>
                        <div class="analytics-card">
                            <h3>Tarefas Concluídas</h3>
                            <div class="analytics-value">${productivityStats.dailyStats[0]?.tasksCompleted || 0}</div>
                            <div class="analytics-label">Tarefas completadas hoje</div>
                        </div>
                        <div class="analytics-card">
                            <h3>Taxa de Conclusão</h3>
                            <div class="analytics-value">${Math.round(productivityStats.insights.completionRate)}%</div>
                            <div class="analytics-label">Tarefas concluídas vs. iniciadas</div>
                        </div>
                    </div>

                    <div class="insights-section">
                        <h2>Insights de Produtividade</h2>
                        <div class="insights-grid">
                            <div class="insight-item">
                                <div class="insight-label">Melhor Horário</div>
                                <div class="insight-value">${productivityStats.insights.bestTimeOfDay}</div>
                            </div>
                            <div class="insight-item">
                                <div class="insight-label">Dia Mais Produtivo</div>
                                <div class="insight-value">${new Date(productivityStats.insights.mostProductiveDay).toLocaleDateString()}</div>
                            </div>
                            <div class="insight-item">
                                <div class="insight-label">Duração Média</div>
                                <div class="insight-value">${this.formatTime(productivityStats.insights.averageTaskDuration)}</div>
                            </div>
                            <div class="insight-item">
                                <div class="insight-label">Tempo Total em Foco</div>
                                <div class="insight-value">${this.formatTime(productivityStats.monthlyStats[0]?.totalFocusTime || 0)}</div>
                            </div>
                        </div>
                    </div>

                    <div class="tasks-section">
                        <h2>Suas Tarefas</h2>
                        <div id="taskList" class="task-list">
                            ${taskListHtml}
                        </div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function formatTime(minutes) {
                        const hours = Math.floor(minutes / 60);
                        const mins = minutes % 60;
                        return \`\${hours}h \${mins}m\`;
                    }

                    function updateTaskList(tasks) {
                        const taskList = document.getElementById('taskList');
                        taskList.innerHTML = tasks.map(task => {
                            const subtasksHtml = task.subtasks.length > 0
                                ? \`<div class="subtasks">
                                    \${task.subtasks.map(subtask => 
                                        \`<div class="subtask \${subtask.completed ? 'completed' : ''}">
                                            <span class="subtask-title">\${subtask.title}</span>
                                            <span class="subtask-time">\${formatTime(subtask.estimatedMinutes)}</span>
                                        </div>\`
                                    ).join('')}
                                </div>\`
                                : '';

                            return \`<div class="task-item \${task.status}">
                                <div class="task-header">
                                    <h3>\${task.title}</h3>
                                    <span class="task-status">\${task.status}</span>
                                </div>
                                <p class="task-description">\${task.description || ''}</p>
                                \${subtasksHtml}
                            </div>\`;
                        }).join('');
                    }

                    function updateHyperfocusStatus(isActive) {
                        const startButton = document.getElementById('startHyperfocus');
                        startButton.textContent = isActive ? 'Parar Hiperfoco' : 'Iniciar Hiperfoco';
                    }

                    function updateAnalytics(stats) {
                        document.querySelector('.analytics-value:nth-child(1)').textContent = formatTime(stats.hyperfocus.todayMinutes);
                        document.querySelector('.analytics-value:nth-child(2)').textContent = stats.productivity.insights.streak;
                        document.querySelector('.analytics-value:nth-child(3)').textContent = stats.productivity.dailyStats[0]?.tasksCompleted || 0;
                        document.querySelector('.analytics-value:nth-child(4)').textContent = Math.round(stats.productivity.insights.completionRate) + '%';

                        document.querySelector('.insight-item:nth-child(1) .insight-value').textContent = stats.productivity.insights.bestTimeOfDay;
                        document.querySelector('.insight-item:nth-child(2) .insight-value').textContent = new Date(stats.productivity.insights.mostProductiveDay).toLocaleDateString();
                        document.querySelector('.insight-item:nth-child(3) .insight-value').textContent = formatTime(stats.productivity.insights.averageTaskDuration);
                        document.querySelector('.insight-item:nth-child(4) .insight-value').textContent = formatTime(stats.productivity.monthlyStats[0]?.totalFocusTime || 0);
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'update':
                                updateTaskList(message.tasks);
                                updateHyperfocusStatus(message.hyperfocus.isActive);
                                updateAnalytics({
                                    hyperfocus: message.hyperfocus,
                                    productivity: message.productivity
                                });
                                break;
                        }
                    });

                    document.getElementById('startHyperfocus').addEventListener('click', () => {
                        vscode.postMessage({ command: 'startFocus' });
                    });

                    document.getElementById('createTask').addEventListener('click', () => {
                        vscode.postMessage({ command: 'createTask' });
                    });
                </script>
            </body>
            </html>
        `;
    }

    public async update(): Promise<void> {
        if (this.panel) {
            const tasks = this.taskTracker.getTasks();
            const hyperfocusStats = this.hyperfocusManager.getStats();
            const productivityStats = this.analysisManager.getStats();

            await this.analysisManager.updateStats(
                hyperfocusStats.todayMinutes,
                tasks
            );

            this.panel.webview.postMessage({
                type: 'update',
                tasks,
                hyperfocus: hyperfocusStats,
                productivity: productivityStats
            });
        }
    }

    public dispose(): void {
        if (this.panel && 'dispose' in this.panel) {
            this.panel.dispose();
        }
        this.panel = undefined;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this.panel = webviewView;
        webviewView.webview.html = this.getWebviewContent();
    }
} 