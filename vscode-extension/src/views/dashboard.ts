import * as vscode from 'vscode';
import { TaskTracker } from '../tasks/tracker';
import { HyperfocusManager } from '../hyperfocus/manager';
import { AnalysisManager } from '../analysis/manager';
import { Task, TaskStatus, TaskPriority } from '../tasks/types';
import { sanitizeForWebview } from '../utils/security';

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
                            <span class="subtask-title">${sanitizeForWebview(subtask.title)}</span>
                            <span class="subtask-time">${this.formatTime(subtask.estimatedMinutes)}</span>
                        </div>`
                    ).join('')}
                </div>`
                : '';

            const priorityClass = getPriorityClass(task.priority);
            const statusClass = getStatusClass(task.status);
            const priorityLabel = getPriorityLabel(task.priority);
            
            return `
                <div class="task-card ${priorityClass}" data-task-id="${task.id}">
                    <div class="task-header">
                        <h3 class="task-title">${sanitizeForWebview(task.title)}</h3>
                        <div class="task-badges">
                            <span class="badge priority-badge ${priorityClass}">${priorityLabel}</span>
                            <span class="badge status-badge ${statusClass}">${getStatusLabel(task.status)}</span>
                        </div>
                    </div>
                    ${task.description ? `<p class="task-description">${sanitizeForWebview(task.description)}</p>` : ''}
                    <div class="task-details">
                        <div class="task-criteria">
                            <div class="criterion">
                                <span class="criterion-label">Complexidade:</span>
                                <span class="criterion-value">${task.priorityCriteria.complexity}/5</span>
                            </div>
                            <div class="criterion">
                                <span class="criterion-label">Impacto:</span>
                                <span class="criterion-value">${task.priorityCriteria.impact}/5</span>
                            </div>
                            <div class="criterion">
                                <span class="criterion-label">Tempo Estimado:</span>
                                <span class="criterion-value">${task.priorityCriteria.estimatedTime} min</span>
                            </div>
                            ${task.priorityCriteria.deadline ? `
                                <div class="criterion">
                                    <span class="criterion-label">Prazo:</span>
                                    <span class="criterion-value">${formatDate(task.priorityCriteria.deadline)}</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="task-actions">
                            <button class="action-button" onclick="completeTask(${task.id})">
                                <span class="codicon codicon-check"></span> Concluir
                            </button>
                            <button class="action-button" onclick="decomposeTask(${task.id})">
                                <span class="codicon codicon-split-horizontal"></span> Decompor
                            </button>
                            <button class="action-button" onclick="deleteTask(${task.id})">
                                <span class="codicon codicon-trash"></span> Excluir
                            </button>
                        </div>
                    </div>
                    ${task.subtasks.length > 0 ? `
                        <div class="subtasks-container">
                            <h4>Subtarefas (${task.subtasks.filter(st => st.status === TaskStatus.COMPLETED).length}/${task.subtasks.length})</h4>
                            <div class="subtasks-list">
                                ${task.subtasks.map(subtask => `
                                    <div class="subtask-item ${subtask.status === TaskStatus.COMPLETED ? 'completed' : ''}">
                                        <input type="checkbox" 
                                            ${subtask.status === TaskStatus.COMPLETED ? 'checked' : ''}
                                            onchange="toggleSubtask(${task.id}, ${subtask.id})">
                                        <span class="subtask-title">${sanitizeForWebview(subtask.title)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Dashboard Dev Helper</title>
                <style>
                    :root {
                        --grid-gap: 1rem;
                        --card-padding: 1rem;
                        --border-radius: 6px;
                    }

                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        padding: 0.5rem;
                        margin: 0;
                        box-sizing: border-box;
                        min-height: 100vh;
                    }

                    .container {
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 0.5rem;
                    }

                    .header {
                        display: flex;
                        flex-wrap: wrap;
                        gap: var(--grid-gap);
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                        padding: 0.5rem;
                    }

                    .header h1 {
                        font-size: clamp(1.2rem, 4vw, 1.5rem);
                        margin: 0;
                    }

                    .actions {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                    }

                    .button {
                        padding: 0.5rem 1rem;
                        border: none;
                        border-radius: var(--border-radius);
                        cursor: pointer;
                        font-size: 0.875rem;
                        white-space: nowrap;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        transition: background-color 0.2s;
                    }

                    .button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    .analytics-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: var(--grid-gap);
                        margin: 1rem 0;
                    }

                    .analytics-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: var(--border-radius);
                        padding: var(--card-padding);
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .analytics-card h3 {
                        margin: 0;
                        font-size: 0.9rem;
                        color: var(--vscode-descriptionForeground);
                    }

                    .analytics-value {
                        font-size: clamp(1.2rem, 3vw, 1.5rem);
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                    }

                    .analytics-label {
                        font-size: 0.8rem;
                        color: var(--vscode-descriptionForeground);
                    }

                    .insights-section {
                        margin: 1rem 0;
                        padding: var(--card-padding);
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: var(--border-radius);
                    }

                    .insights-section h2 {
                        font-size: clamp(1.1rem, 3vw, 1.3rem);
                        margin: 0 0 1rem 0;
                    }

                    .insights-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: var(--grid-gap);
                    }

                    .insight-item {
                        padding: 0.75rem;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: var(--border-radius);
                    }

                    .insight-label {
                        font-size: 0.8rem;
                        color: var(--vscode-descriptionForeground);
                    }

                    .insight-value {
                        font-size: clamp(0.9rem, 2.5vw, 1.1rem);
                        color: var(--vscode-textLink-foreground);
                        margin-top: 0.25rem;
                        word-break: break-word;
                    }

                    .tasks-section {
                        margin: 1rem 0;
                    }

                    .tasks-section h2 {
                        font-size: clamp(1.1rem, 3vw, 1.3rem);
                        margin: 0 0 1rem 0;
                    }

                    .task-list {
                        display: grid;
                        gap: var(--grid-gap);
                    }

                    .task-item {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: var(--border-radius);
                        padding: var(--card-padding);
                    }

                    .task-header {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 0.5rem;
                    }

                    .task-header h3 {
                        margin: 0;
                        font-size: clamp(0.9rem, 2.5vw, 1rem);
                        flex: 1;
                        min-width: 200px;
                    }

                    .task-status {
                        font-size: 0.8rem;
                        padding: 0.25rem 0.5rem;
                        border-radius: var(--border-radius);
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        white-space: nowrap;
                    }

                    .task-description {
                        margin: 0.5rem 0;
                        font-size: 0.875rem;
                        color: var(--vscode-descriptionForeground);
                        word-break: break-word;
                    }

                    .subtasks {
                        margin-top: 0.5rem;
                        padding-top: 0.5rem;
                        border-top: 1px solid var(--vscode-panel-border);
                    }

                    .subtask {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.5rem 0;
                        font-size: 0.875rem;
                    }

                    .subtask.completed {
                        color: var(--vscode-descriptionForeground);
                        text-decoration: line-through;
                    }

                    .subtask-title {
                        flex: 1;
                        min-width: 150px;
                        word-break: break-word;
                    }

                    .subtask-time {
                        color: var(--vscode-descriptionForeground);
                        white-space: nowrap;
                    }

                    .task-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 16px;
                        margin-bottom: 16px;
                        transition: all 0.3s ease;
                    }

                    .task-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }

                    .priority-urgent {
                        border-left: 4px solid #ff4d4d;
                    }

                    .priority-high {
                        border-left: 4px solid #ffa64d;
                    }

                    .priority-medium {
                        border-left: 4px solid #4d94ff;
                    }

                    .priority-low {
                        border-left: 4px solid #4dff4d;
                    }

                    .task-badges {
                        display: flex;
                        gap: 8px;
                    }

                    .badge {
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 500;
                    }

                    .priority-badge {
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                    }

                    .priority-urgent .priority-badge {
                        background: #ff4d4d;
                        color: white;
                    }

                    .priority-high .priority-badge {
                        background: #ffa64d;
                        color: white;
                    }

                    .priority-medium .priority-badge {
                        background: #4d94ff;
                        color: white;
                    }

                    .priority-low .priority-badge {
                        background: #4dff4d;
                        color: #1a1a1a;
                    }

                    .task-criteria {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 12px;
                        margin: 12px 0;
                        padding: 12px;
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                    }

                    .criterion {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .criterion-label {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }

                    .criterion-value {
                        font-weight: 500;
                        color: var(--vscode-foreground);
                    }

                    @media (max-width: 480px) {
                        .header {
                            flex-direction: column;
                            align-items: stretch;
                        }

                        .actions {
                            justify-content: stretch;
                        }

                        .button {
                            flex: 1;
                            text-align: center;
                        }

                        .analytics-grid {
                            grid-template-columns: 1fr;
                        }

                        .insights-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Dashboard Dev Helper</h1>
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
                                            <span class="subtask-title">\${sanitizeForWebview(subtask.title)}</span>
                                            <span class="subtask-time">\${formatTime(subtask.estimatedMinutes)}</span>
                                        </div>\`
                                    ).join('')}
                                </div>\`
                                : '';

                            const priorityClass = getPriorityClass(task.priority);
                            const statusClass = getStatusClass(task.status);
                            const priorityLabel = getPriorityLabel(task.priority);
                            
                            return \`<div class="task-card \${priorityClass}" data-task-id="\${task.id}">
                                <div class="task-header">
                                    <h3 class="task-title">\${sanitizeForWebview(task.title)}</h3>
                                    <div class="task-badges">
                                        <span class="badge priority-badge \${priorityClass}">\${priorityLabel}</span>
                                        <span class="badge status-badge \${statusClass}">\${getStatusLabel(task.status)}</span>
                                    </div>
                                </div>
                                \${task.description ? \`<p class="task-description">\${sanitizeForWebview(task.description)}</p>\` : ''}
                                <div class="task-details">
                                    <div class="task-criteria">
                                        <div class="criterion">
                                            <span class="criterion-label">Complexidade:</span>
                                            <span class="criterion-value">\${task.priorityCriteria.complexity}/5</span>
                                        </div>
                                        <div class="criterion">
                                            <span class="criterion-label">Impacto:</span>
                                            <span class="criterion-value">\${task.priorityCriteria.impact}/5</span>
                                        </div>
                                        <div class="criterion">
                                            <span class="criterion-label">Tempo Estimado:</span>
                                            <span class="criterion-value">\${task.priorityCriteria.estimatedTime} min</span>
                                        </div>
                                        \${task.priorityCriteria.deadline ? \`
                                            <div class="criterion">
                                                <span class="criterion-label">Prazo:</span>
                                                <span class="criterion-value">\${formatDate(task.priorityCriteria.deadline)}</span>
                                            </div>
                                        \` : ''}
                                    </div>
                                    <div class="task-actions">
                                        <button class="action-button" onclick="completeTask(\${task.id})">
                                            <span class="codicon codicon-check"></span> Concluir
                                        </button>
                                        <button class="action-button" onclick="decomposeTask(\${task.id})">
                                            <span class="codicon codicon-split-horizontal"></span> Decompor
                                        </button>
                                        <button class="action-button" onclick="deleteTask(\${task.id})">
                                            <span class="codicon codicon-trash"></span> Excluir
                                        </button>
                                    </div>
                                </div>
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

function getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
        case TaskPriority.URGENT:
            return 'priority-urgent';
        case TaskPriority.HIGH:
            return 'priority-high';
        case TaskPriority.MEDIUM:
            return 'priority-medium';
        case TaskPriority.LOW:
            return 'priority-low';
        default:
            return '';
    }
}

function getPriorityLabel(priority: TaskPriority): string {
    switch (priority) {
        case TaskPriority.URGENT:
            return 'Urgente';
        case TaskPriority.HIGH:
            return 'Alta';
        case TaskPriority.MEDIUM:
            return 'Média';
        case TaskPriority.LOW:
            return 'Baixa';
        default:
            return 'Não definida';
    }
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
}

function getStatusClass(status: TaskStatus): string {
    switch (status) {
        case TaskStatus.COMPLETED:
            return 'status-completed';
        case TaskStatus.IN_PROGRESS:
            return 'status-in-progress';
        case TaskStatus.NOT_STARTED:
            return 'status-not-started';
        case TaskStatus.PAUSED:
            return 'status-paused';
        default:
            return '';
    }
}

function getStatusLabel(status: TaskStatus): string {
    switch (status) {
        case TaskStatus.COMPLETED:
            return 'Concluída';
        case TaskStatus.IN_PROGRESS:
            return 'Em progresso';
        case TaskStatus.NOT_STARTED:
            return 'Não iniciada';
        case TaskStatus.PAUSED:
            return 'Pausada';
        default:
            return 'Status desconhecido';
    }
} 