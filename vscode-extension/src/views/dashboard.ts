import * as vscode from 'vscode';
import { TaskTracker } from '../tasks/tracker';
import { HyperfocusManager } from '../hyperfocus/manager';
import { AnalysisManager } from '../analysis/manager';
import { ProductivityStats } from '../types/analytics';
import { TaskStatus } from '../tasks/types';
import { TagManager } from '../tasks/tag-manager';
import { Task } from '../tasks/types';

export class DashboardView implements vscode.WebviewViewProvider {
    private webviewView: vscode.WebviewView | undefined;
    private disposables: vscode.Disposable[] = [];
    private tagManager: TagManager;

    public constructor(
        private taskTracker: TaskTracker,
        private hyperfocusManager: HyperfocusManager,
        private analysisManager: AnalysisManager,
        context: vscode.ExtensionContext
    ) {
        this.tagManager = TagManager.getInstance(context);
        this.initialize();
    }

    private initialize(): void {
        this.disposables.push(
            vscode.commands.registerCommand('dev-helper.manageTags', () => {
                this.showTagManagement();
            }),
            vscode.commands.registerCommand('dev-helper.manageCategories', () => {
                this.showCategoryManagement();
            })
        );
    }

    private showTagManagement(): void {
        const tags = this.tagManager.getTags();
        const quickPick = vscode.window.createQuickPick();
        let selectedTag: any;
        let tagToEdit: any;
        let tagToDelete: any;

        quickPick.items = [
            { label: '$(plus) Criar nova tag', description: 'Adicionar uma nova tag' },
            { label: '$(pencil) Editar tag', description: 'Modificar uma tag existente' },
            { label: '$(trash) Excluir tag', description: 'Remover uma tag' },
            ...tags.map(tag => ({
                label: `$(tag) ${tag.name}`,
                description: tag.description || '',
                detail: `Cor: ${tag.color}`,
                tag
            }))
        ];

        quickPick.onDidChangeSelection(async ([item]) => {
            if (!item) return;

            switch (item.label) {
                case '$(plus) Criar nova tag':
                    await vscode.commands.executeCommand('dev-helper.createTag');
                    break;
                case '$(pencil) Editar tag':
                    selectedTag = await vscode.window.showQuickPick(
                        tags.map(t => ({ label: t.name, value: t })),
                        { placeHolder: 'Selecione a tag para editar' }
                    );
                    if (selectedTag) {
                        tagToEdit = selectedTag.value;
                        await vscode.commands.executeCommand('dev-helper.editTag', tagToEdit);
                    }
                    break;
                case '$(trash) Excluir tag':
                    selectedTag = await vscode.window.showQuickPick(
                        tags.map(t => ({ label: t.name, value: t })),
                        { placeHolder: 'Selecione a tag para excluir' }
                    );
                    if (selectedTag) {
                        tagToDelete = selectedTag.value;
                        await vscode.commands.executeCommand('dev-helper.deleteTag', tagToDelete);
                    }
                    break;
            }
            quickPick.hide();
        });

        quickPick.show();
    }

    private showCategoryManagement(): void {
        const categories = this.tagManager.getCategories();
        const quickPick = vscode.window.createQuickPick();
        let selectedCategory: any;
        let categoryToEdit: any;
        let categoryToDelete: any;

        quickPick.items = [
            { label: '$(plus) Criar nova categoria', description: 'Adicionar uma nova categoria' },
            { label: '$(pencil) Editar categoria', description: 'Modificar uma categoria existente' },
            { label: '$(trash) Excluir categoria', description: 'Remover uma categoria' },
            ...categories.map(category => ({
                label: `$(folder) ${category.name}`,
                description: category.description || '',
                detail: `Cor: ${category.color}`,
                category
            }))
        ];

        quickPick.onDidChangeSelection(async ([item]) => {
            if (!item) return;

            switch (item.label) {
                case '$(plus) Criar nova categoria':
                    await vscode.commands.executeCommand('dev-helper.createCategory');
                    break;
                case '$(pencil) Editar categoria':
                    selectedCategory = await vscode.window.showQuickPick(
                        categories.map(c => ({ label: c.name, value: c })),
                        { placeHolder: 'Selecione a categoria para editar' }
                    );
                    if (selectedCategory) {
                        categoryToEdit = selectedCategory.value;
                        await vscode.commands.executeCommand('dev-helper.editCategory', categoryToEdit);
                    }
                    break;
                case '$(trash) Excluir categoria':
                    selectedCategory = await vscode.window.showQuickPick(
                        categories.map(c => ({ label: c.name, value: c })),
                        { placeHolder: 'Selecione a categoria para excluir' }
                    );
                    if (selectedCategory) {
                        categoryToDelete = selectedCategory.value;
                        await vscode.commands.executeCommand('dev-helper.deleteCategory', categoryToDelete);
                    }
                    break;
            }
            quickPick.hide();
        });

        quickPick.show();
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
        const tasks = this.taskTracker.getTasks();
        const tags = this.tagManager.getTags();
        const categories = this.tagManager.getCategories();
        const currentTask = (this.taskTracker as any).currentTask || null;
        const statusList = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dev Helper Dashboard</title>
  <link rel="stylesheet" href="https://microsoft.github.io/vscode-codicons/dist/codicon.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --radius: 6px; /* Slightly reduced radius for a sharper look */
      --card-bg: var(--vscode-sideBar-background);
      --card-border: var(--vscode-panel-border);
      /* Softer shadow for a more modern feel */
      --card-shadow: 0 1px 3px var(--vscode-widget-shadow, rgba(0,0,0,0.1)), 0 1px 2px var(--vscode-widget-shadow, rgba(0,0,0,0.06));
      --card-shadow-hover: 0 4px 12px var(--vscode-widget-shadow, rgba(0,0,0,0.12)), 0 2px 6px var(--vscode-widget-shadow, rgba(0,0,0,0.08));

      --primary: var(--vscode-button-background, var(--vscode-editor-selectionBackground));
      --primary-fg: var(--vscode-button-foreground, var(--vscode-editor-foreground));
      --input-bg: var(--vscode-input-background, var(--vscode-editorWidget-background));
      --input-border: var(--vscode-input-border, var(--vscode-panel-border));
      --muted: var(--vscode-editor-inactiveSelectionBackground);
      --muted-fg: var(--vscode-descriptionForeground);
      --accent: var(--vscode-editor-selectionHighlightBackground, #6c63ff); /* Keep accent for specific highlights */
      --text-color: var(--vscode-editor-foreground);
      --text-muted-color: var(--vscode-descriptionForeground);
      --border-color: var(--vscode-panel-border);
    }

    *, *::before, *::after {
        box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family);
      color: var(--text-color);
      background: var(--vscode-editor-background);
      margin: 0;
      padding: 0;
      line-height: 1.6; /* Improved readability */
    }

    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px; /* Consistent padding */
      display: flex;
      flex-direction: column;
      gap: 28px; /* Consistent gap */
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      gap: 10px; /* Slightly reduced gap */
      margin-bottom: 16px; /* More space after header */
    }

    .dashboard-header .codicon {
      font-size: 1.8rem; /* Slightly smaller icon */
      color: var(--primary);
      opacity: 0.85; /* More visible */
    }

    .dashboard-title {
      font-size: 1.8rem; /* Adjusted size */
      font-weight: 600; /* Less aggressive weight */
      letter-spacing: -0.5px; /* Softer letter spacing */
      color: var(--text-color);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Slightly smaller minmax */
      gap: 16px; /* Reduced gap */
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      box-shadow: var(--card-shadow);
      padding: 16px; /* Adjusted padding */
      display: flex;
      flex-direction: column;
      gap: 6px; /* Reduced gap inside card */
      min-height: 120px; /* Adjusted min-height to accommodate charts */
      position: relative;
      transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out, border-color 0.2s ease-in-out;
    }
    
    .card.chart-card { /* Specific class for cards containing charts */
        padding: 12px; /* Less padding if chart has its own */
        justify-content: space-between; /* Align title top, chart/desc bottom */
    }

    .card:hover {
      box-shadow: var(--card-shadow-hover);
      transform: translateY(-2px); /* Subtle lift effect */
    }
    
    .card.clickable-card:hover {
        /* More pronounced hover for clickable cards */
        border-color: var(--accent); 
        /* background-color: color-mix(in srgb, var(--card-bg) 95%, var(--accent) 5%); */ /* Subtle bg change if desired */
    }
    
    .clickable-card {
        cursor: pointer;
    }

    .card .codicon { /* Icon for non-chart cards */
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 1.6rem; /* Adjusted size */
      opacity: 0.25; /* Slightly more visible but still subtle */
      pointer-events: none;
    }
    
    .card-title { /* Applies to all cards */
      margin: 0;
      font-size: 0.9rem; /* Slightly smaller */
      color: var(--text-muted-color);
      font-weight: 500;
      line-height: 1.4;
    }

    .card-value { /* For non-chart cards */
      margin: 0;
      font-size: 1.8rem; /* Slightly smaller for balance */
      font-weight: 600; /* Less aggressive than bold */
      color: var(--text-color);
      line-height: 1.2;
    }

    .card-desc { /* For non-chart cards and general descriptions */
      color: var(--text-muted-color);
      font-size: 0.85rem; /* Slightly smaller */
      line-height: 1.4;
    }

    .chart-container {
        flex-grow: 1;
        position: relative; /* For canvas absolute positioning if needed */
        display: flex; /* Center canvas */
        align-items: center; /* Center canvas */
        justify-content: center; /* Center canvas */
        margin-top: 8px; /* Space between title and chart */
        min-height: 80px; /* Ensure space for chart rendering */
    }

    .chart-container canvas {
        max-width: 100%;
        max-height: 100%; /* Ensure canvas is responsive within container */
    }


    .section {
      /* margin-top: 12px; removed, using main gap */
      /* margin-bottom: 8px; removed, using main gap */
    }

    .section-title {
      font-size: 1.3rem; /* Slightly larger for better hierarchy */
      font-weight: 600;
      margin-bottom: 12px; /* Increased space */
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filters {
      display: flex;
      gap: 10px; /* Adjusted gap */
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 16px; /* More space */
      padding: 10px; /* Adjusted padding */
      background-color: var(--vscode-textInput-background, var(--vscode-editorWidget-background)); /* Use more specific var if available */
      border-radius: var(--radius);
      border: 1px solid var(--border-color);
    }

    .filters label {
      font-size: 0.9rem;
      color: var(--text-muted-color);
      margin-right: 2px; /* Reduced margin */
    }

    .filters select, .filters button {
      border-radius: var(--radius);
      border: 1px solid var(--input-border);
      background: var(--input-bg);
      color: var(--text-color);
      padding: 5px 8px; /* Adjusted padding */
      font-size: 0.9em; /* Adjusted font size */
      /* margin-right: 4px; Handled by gap in .filters */
    }
    
    .filters select:focus, .filters button:focus {
        outline: 1px solid var(--vscode-focusBorder, var(--primary)); /* VSCode style focus */
        outline-offset: -1px;
    }

    .filters button {
      background: var(--primary);
      color: var(--primary-fg);
      border: 1px solid transparent; /* Adding border for consistency, transparent for primary */
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px; /* Icon-text gap */
      font-weight: 500;
      transition: background-color 0.2s ease-in-out;
    }

    .filters button:hover {
      background: var(--vscode-button-hoverBackground, var(--accent)); /* Use VS Code hover if available */
    }
    
    .filters button .codicon {
        font-size: 1em; /* Adjust icon size in buttons */
    }

    .tag, .category {
      display: inline-flex; /* For better alignment if icons were added */
      align-items: center;
      padding: 2px 8px; /* Adjusted padding */
      border-radius: 12px; /* More pill-like */
      font-size: 0.8rem; /* Smaller font */
      margin: 2px; /* Simpler margin */
      color: var(--vscode-button-foreground); /* Ensure contrast, fallback if needed */
      font-weight: 500;
      line-height: 1.4; /* Added line-height */
      /* Background color is set inline */
    }

    .tag-list, .category-list {
      margin: 0; /* Reset margin, handled by grid gap */
      padding: 12px;
      background: var(--vscode-editorWidget-background, var(--card-bg)); /* Subtle background */
      border-radius: var(--radius);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 8px; /* Space between header and items */
    }
    
    .tag-list h3, .category-list h3 {
        margin: 0 0 4px 0; /* Adjusted margin */
        font-size: 1em; /* Base size */
        font-weight: 600;
        color: var(--text-color);
        display: flex;
        align-items: center;
        gap: 6px; /* Icon and text gap */
    }
    .tag-list h3 .codicon, .category-list h3 .codicon {
        font-size: 1.1em; /* Slightly larger icon */
    }


    .tag-item, .category-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px; /* Spacing between items */
      gap: 8px;
      padding: 6px; /* Add some padding */
      border-radius: var(--radius);
      transition: background-color 0.15s ease-in-out;
    }
    .tag-item:hover, .category-item:hover {
        background-color: var(--vscode-list-hoverBackground, var(--muted));
    }
    
    .tag-name, .category-name { /* For bolding the name */
        font-weight: 600;
        color: var(--text-color);
        font-size: 0.9em;
    }
    .tag-desc, .category-desc { /* For the description */
        font-size: 0.85em;
        margin-left: 2px; /* Align with name after color swatch */
    }


    .tag-color, .category-color {
      width: 14px; /* Slightly smaller */
      height: 14px;
      border-radius: 50%;
      /* margin-right: 4px; Handled by gap */
      border: 1px solid var(--border-color);
      flex-shrink: 0; /* Prevent shrinking */
    }

    .task-list {
      display: flex;
      flex-direction: column;
      gap: 12px; /* Reduced gap */
      margin-top: 0; /* section-title has margin-bottom */
    }

    .task-item {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--border-color);
      border-left: 3px solid var(--border-color); /* Default left border */
      border-radius: var(--radius);
      padding: 12px 14px; /* Adjusted padding */
      box-shadow: var(--card-shadow);
      /* margin-bottom: 2px; Handled by gap in .task-list */
      position: relative;
      transition: box-shadow 0.2s ease-in-out, border-left-color 0.2s ease-in-out; /* Animate border color */
    }
    
    .task-item:hover {
        box-shadow: var(--card-shadow-hover);
        border-left-color: var(--accent); /* Accent color on hover */
    }

    .task-item.current {
      border-left: 3px solid var(--primary); /* Emphasize with a thicker left border */
      box-shadow: var(--card-shadow-hover); /* Add shadow to current task */
    }

    .task-item h3 {
      margin: 0 0 6px 0; /* Adjusted margin */
      font-size: 1.05rem; /* Slightly adjusted */
      font-weight: 600;
      color: var(--text-color);
    }

    .task-tags {
      margin-bottom: 8px; /* Increased margin */
      display: flex; /* Enable wrapping for many tags */
      flex-wrap: wrap;
      gap: 6px; /* Increased gap for tags */
    }

    .task-info {
      font-size: 0.85rem; /* Slightly smaller */
      color: var(--text-muted-color);
      margin-bottom: 8px; /* More space before progress */
      line-height: 1.5;
    }
    
    .task-info span { /* Individual info items */
        margin-right: 6px; /* Space between items */
        display: inline-block; /* Ensure proper spacing */
    }
    
    .task-info span:last-child {
        margin-right: 0;
    }


    .task-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px; /* Adjusted margin */
    }

    .progress-bar {
      flex-grow: 1; /* Allow progress bar to take available space */
      height: 6px; /* Thinner bar */
      background: var(--muted);
      border-radius: 3px; /* Rounded to match height */
      overflow: hidden;
    }

    .progress {
      height: 100%;
      background: var(--primary); /* Simpler background, can be gradient if preferred */
      border-radius: 3px;
      transition: width 0.4s cubic-bezier(.4,1.4,.6,1);
    }
    
    .task-progress span { /* Percentage text */
        font-size: 0.85rem;
        color: var(--text-muted-color);
        font-weight: 500;
    }
    
    .tag-category-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }


    @media (max-width: 768px) { /* Adjusted breakpoint */
      main { 
        padding: 16px; /* Less padding on smaller screens */
        gap: 20px; 
      }
      .stats-grid { 
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); /* Smaller cards on mobile */
        gap: 12px;
      }
      .dashboard-title {
        font-size: 1.6rem;
      }
      .section-title {
        font-size: 1.15rem;
      }
      .filters {
        padding: 10px;
        gap: 8px;
      }
      .filters select, .filters button {
        padding: 5px 8px;
        font-size: 0.9em;
      }
      .task-item h3 {
        font-size: 1rem;
      }
      .tag-category-grid {
        grid-template-columns: 1fr; /* Stack tag/category lists */
      }
    }

    @media (max-width: 480px) {
        .stats-grid {
            grid-template-columns: 1fr; /* Single column for very small screens */
        }
        .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            margin-bottom: 12px;
        }
        .dashboard-header .codicon {
            font-size: 1.6rem;
        }
         .dashboard-title {
            font-size: 1.5rem;
        }
        .filters {
            flex-direction: column;
            align-items: stretch;
        }
        .filters label {
            margin-bottom: 2px; /* Space out labels in column layout */
        }
        .filters select, .filters button {
            width: 100%; /* Full width controls in column layout */
        }
    }

  </style>
</head>
<body>
  <main>
    <header class="dashboard-header">
      <span class="codicon codicon-dashboard"></span>
      <span class="dashboard-title">Dev Helper Dashboard</span>
    </header>

    <section aria-label="Estatísticas" class="section">
      <div class="stats-grid">
        <div class="card chart-card">
            <div class="card-title"><span class="codicon codicon-clock" style="margin-right: 4px;"></span>Tempo Foco (Hoje)</div>
            <div class="chart-container">
                <canvas id="focusTimeChart"></canvas>
            </div>
            <div id="focus-time-value" class="card-desc" style="text-align:center; margin-top: 4px;">0 minutos</div>
        </div>
        <div class="card clickable-card" data-action="view-streak-details"><span class="codicon codicon-flame"></span><div class="card-title">Sequência</div><div class="card-value" id="streak">0 dias</div><div class="card-desc">Streak</div></div>
        <div class="card clickable-card" data-action="view-completed-tasks-details"><span class="codicon codicon-check"></span><div class="card-title">Tarefas Concluídas</div><div class="card-value" id="tasks-completed">0</div></div>
        <div class="card chart-card">
            <div class="card-title"><span class="codicon codicon-rocket" style="margin-right: 4px;"></span>Taxa de Conclusão</div>
            <div class="chart-container">
                <canvas id="completionRateChart"></canvas>
            </div>
            <div id="completion-rate-value" class="card-desc" style="text-align:center; margin-top: 4px;">0%</div>
        </div>
        <div class="card clickable-card" data-action="view-productivity-timing-details"><span class="codicon codicon-calendar"></span><div class="card-title">Hora Mais Produtiva</div><div class="card-value" id="most-productive-hour">--:--</div></div>
        <div class="card clickable-card" data-action="view-productivity-timing-details"><span class="codicon codicon-star"></span><div class="card-title">Melhor Dia</div><div class="card-value" id="best-day">--</div></div>
        <div class="card clickable-card" data-action="view-task-duration-details"><span class="codicon codicon-timer"></span><div class="card-title">Duração Média</div><div class="card-value" id="avg-task-duration">0 minutos</div></div>
        <div class="card clickable-card" data-action="view-total-focus-details"><span class="codicon codicon-history"></span><div class="card-title">Tempo Total Foco</div><div class="card-value" id="total-focus-time">0 minutos</div></div>
      </div>
    </section>

    <section aria-label="Filtros e ações" class="section">
      <div class="section-title"><span class="codicon codicon-list-unordered"></span> Tarefas</div>
      <div class="filters">
        <label for="filter-status">Status:</label>
        <select id="filter-status">
          <option value="">Todos</option>
          ${statusList.map(s => `<option value="${s}">${s === 'PENDING' ? 'Pendente' : s === 'IN_PROGRESS' ? 'Em andamento' : 'Concluída'}</option>`).join('')}
        </select>
        <label for="filter-tag">Tag:</label>
        <select id="filter-tag">
          <option value="">Todas</option>
          ${tags.map(tag => `<option value="${tag.name}">${tag.name}</option>`).join('')}
        </select>
        <label for="filter-category">Categoria:</label>
        <select id="filter-category">
          <option value="">Todas</option>
          ${categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
        </select>
        <button id="btn-create-task" title="Criar nova tarefa"><span class="codicon codicon-add"></span>Nova</button>
        <button id="btn-focus-mode" title="Iniciar/Pausar Foco"><span class="codicon codicon-flame"></span>Foco</button>
      </div>
      <div class="task-list" id="task-list">
        ${tasks.map(task => `
          <article class="task-item${task.id === currentTask?.id ? ' current' : ''}" data-status="${task.status}" data-tag="${task.tags.map(t => t.name).join(',')}" data-category="${task.category ? task.category.name : ''}">
            <h3>${task.title}</h3>
            <div class="task-tags">
              ${task.tags.map(tag => `<span class="tag" style="background-color: ${tag.color}">${tag.name}</span>`).join('')}
              ${task.category ? `<span class="category" style="background-color: ${task.category.color}">${task.category.name}</span>` : ''}
            </div>
            <div class="task-info">
              <span>Status: ${task.status}</span>
              <span>Prioridade: ${task.priorityCriteria.complexity}</span>
              <span>Impacto: ${task.priorityCriteria.impact}</span>
              ${task.priorityCriteria.deadline ? `<span>Prazo: ${task.priorityCriteria.deadline.toLocaleDateString()}</span>` : ''}
            </div>
            <div class="task-progress">
              <div class="progress-bar"><div class="progress" style="width: ${this.calculateTaskProgress(task)}%"></div></div>
              <span>${this.calculateTaskProgress(task)}%</span>
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <section aria-label="Gestão de Tags e Categorias" class="section">
      <div class="section-title"><span class="codicon codicon-tag"></span> Tags e Categorias</div>
      <div class="tag-category-grid">
        <div class="tag-list">
          <h3><span class="codicon codicon-tag"></span> Tags Disponíveis</h3>
          ${tags.length === 0 ? '<p class="card-desc">Nenhuma tag cadastrada.</p>' : tags.map(tag => `
            <div class="tag-item">
              <span class="tag-color" style="background-color: ${tag.color}"></span>
              <strong class="tag-name">${tag.name}</strong>
              ${tag.description ? `<span class="tag-desc card-desc">${tag.description}</span>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="category-list">
          <h3><span class="codicon codicon-folder"></span> Categorias</h3>
          ${categories.length === 0 ? '<p class="card-desc">Nenhuma categoria cadastrada.</p>' : categories.map(category => `
            <div class="category-item">
              <span class="category-color" style="background-color: ${category.color}"></span>
              <strong class="category-name">${category.name}</strong>
              ${category.description ? `<span class="category-desc card-desc">${category.description}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  </main>
  <script>
    // Single vscodeApi instance
    const vscodeApi = acquireVsCodeApi();

    // Chart instances
    let focusTimeChartInstance = null;
    let completionRateChartInstance = null;

    // Helper to get CSS variable values
    function getCssVariable(variableName) {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    }
    
    // DOM Elements (cached on DOMContentLoaded)
    let statusFilter, tagFilter, categoryFilter, taskList, statsGrid, createTaskButton, focusModeButton;

    document.addEventListener('DOMContentLoaded', function() {
        // Initialize DOM element variables
        statusFilter = document.getElementById('filter-status');
        tagFilter = document.getElementById('filter-tag');
        categoryFilter = document.getElementById('filter-category');
        taskList = document.getElementById('task-list');
        statsGrid = document.querySelector('.stats-grid');
        createTaskButton = document.getElementById('btn-create-task');
        focusModeButton = document.getElementById('btn-focus-mode');

        // Event Listeners for filters
        if (statusFilter) statusFilter.addEventListener('change', filterTasks);
        if (tagFilter) tagFilter.addEventListener('change', filterTasks);
        if (categoryFilter) categoryFilter.addEventListener('change', filterTasks);

        // Event Listeners for buttons
        if (createTaskButton) {
            createTaskButton.onclick = function() {
                vscodeApi.postMessage({ command: 'createTask' });
            };
        }
        if (focusModeButton) {
            focusModeButton.onclick = function() {
                vscodeApi.postMessage({ command: 'startFocus' });
            };
        }

        // Event listener for clickable cards (delegated to statsGrid)
        if (statsGrid) {
            statsGrid.addEventListener('click', function(event) {
                const card = event.target.closest('.clickable-card');
                if (card && card.dataset.action) {
                    const action = card.dataset.action;
                    console.log('Card clicked:', action);
                    vscodeApi.postMessage({
                        command: 'dashboardCardClicked',
                        action: action
                    });
                }
            });
        }
    });

    function filterTasks() {
      // Ensure elements are available before trying to read their values
      if (!statusFilter || !tagFilter || !categoryFilter || !taskList) return;

      const status = statusFilter.value;
      const tag = tagFilter.value;
      const category = categoryFilter.value;
      Array.from(taskList.children).forEach(function(el) {
        const elStatus = el.getAttribute('data-status');
        const elTags = el.getAttribute('data-tag') || '';
        const elCategory = el.getAttribute('data-category') || '';
        let show = true;
        if (status && elStatus !== status) show = false;
        if (tag && !elTags.split(',').includes(tag)) show = false;
        if (category && elCategory !== category) show = false;
        el.style.display = show ? '' : 'none';
      });
    }
    
    window.addEventListener('message', function(event) {
      var message = event.data;
      switch (message.type) {
        case 'update':
          if (message.stats) {
            var stats = message.stats;
            // Elements for dynamic text updates - these are fine to query here as they are within the update scope
            var elementsToUpdate = {
              streak: document.getElementById('streak'),
              tasksCompleted: document.getElementById('tasks-completed'),
              mostProductiveHour: document.getElementById('most-productive-hour'),
              bestDay: document.getElementById('best-day'),
              avgTaskDuration: document.getElementById('avg-task-duration'),
              totalFocusTime: document.getElementById('total-focus-time'),
              focusTimeValueDisplay: document.getElementById('focus-time-value'),
              completionRateValueDisplay: document.getElementById('completion-rate-value')
            };

            if (elementsToUpdate.streak) elementsToUpdate.streak.textContent = stats.streak + ' dias';
            if (elementsToUpdate.tasksCompleted) elementsToUpdate.tasksCompleted.textContent = stats.tasksCompleted;
            if (elementsToUpdate.mostProductiveHour) elementsToUpdate.mostProductiveHour.textContent = stats.mostProductiveHour ? stats.mostProductiveHour + 'h' : '--:--';
            if (elementsToUpdate.bestDay) elementsToUpdate.bestDay.textContent = stats.bestDay || '--';
            if (elementsToUpdate.avgTaskDuration) elementsToUpdate.avgTaskDuration.textContent = stats.avgTaskDuration + ' minutos';
            if (elementsToUpdate.totalFocusTime) elementsToUpdate.totalFocusTime.textContent = stats.totalFocusTime + ' minutos';
            if (elementsToUpdate.focusTimeValueDisplay) elementsToUpdate.focusTimeValueDisplay.textContent = stats.focusTime + ' minutos';
            if (elementsToUpdate.completionRateValueDisplay) elementsToUpdate.completionRateValueDisplay.textContent = stats.completionRate + '%';
            
            updateFocusTimeChart(stats.focusTime);
            updateCompletionRateChart(stats.completionRate);
          }
          break;
      }
    });

    function updateFocusTimeChart(focusTimeMinutes) {
        const ctx = document.getElementById('focusTimeChart')?.getContext('2d');
        if (!ctx) return;

        const primaryColor = getCssVariable('--primary');
        const textColor = getCssVariable('--text-color');
        const mutedColor = getCssVariable('--muted');
        const fontFamily = getCssVariable('--vscode-font-family');
        
        const dailyGoalMinutes = 480; // Example: 8 hours

        if (focusTimeChartInstance) {
            focusTimeChartInstance.data.datasets[0].data = [focusTimeMinutes];
            focusTimeChartInstance.options.scales.y.max = Math.max(dailyGoalMinutes, focusTimeMinutes + 60); // Ensure goal or current time is visible
            focusTimeChartInstance.update();
        } else {
            focusTimeChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Hoje'],
                    datasets: [{
                        label: 'Tempo Focado (minutos)',
                        data: [focusTimeMinutes],
                        backgroundColor: [primaryColor],
                        borderColor: [primaryColor],
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.5,
                        categoryPercentage: 0.7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y', // Horizontal bar
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: Math.max(dailyGoalMinutes, focusTimeMinutes + 60),
                            grid: { display: false },
                            ticks: { 
                                color: textColor,
                                font: { family: fontFamily, size: 10 }
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { 
                                color: textColor,
                                font: { family: fontFamily, size: 12 }
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: getCssVariable('--vscode-editorWidget-background'),
                            titleColor: textColor,
                            bodyColor: textColor,
                            borderColor: getCssVariable('--border-color'),
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.raw + ' min';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function updateCompletionRateChart(completionRate) {
        const ctx = document.getElementById('completionRateChart')?.getContext('2d');
        if (!ctx) return;

        const primaryColor = getCssVariable('--primary');
        const mutedColor = getCssVariable('--muted'); // For the unfilled part
        const textColor = getCssVariable('--text-color');
        const fontFamily = getCssVariable('--vscode-font-family');

        const data = [completionRate, 100 - completionRate];

        if (completionRateChartInstance) {
            completionRateChartInstance.data.datasets[0].data = data;
            completionRateChartInstance.update();
        } else {
            completionRateChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Concluído', 'Restante'],
                    datasets: [{
                        data: data,
                        backgroundColor: [primaryColor, mutedColor],
                        borderColor: [primaryColor, mutedColor], // Or card-bg for less visible border
                        borderWidth: 1,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%', // Makes it a donut
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: getCssVariable('--vscode-editorWidget-background'),
                            titleColor: textColor,
                            bodyColor: textColor,
                            borderColor: getCssVariable('--border-color'),
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    if (context.dataIndex === 0) {
                                        return \`Concluído: \${context.raw}%\`;
                                    }
                                    return null; // Don't show tooltip for the "Restante" part
                                }
                            }
                        }
                    },
                    elements: {
                        arc: {
                            borderWidth: 0 // Remove border from arcs if not desired
                        }
                    }
                }
            });
        }
    }
  </script>
</body>
</html>
        `;
    }

    // Helper to calculate task progress (assuming subtasks determine progress)
    private calculateTaskProgress(task: Task): number {
        if (task.subtasks.length === 0) return 0;
        const completedSubtasks = task.subtasks.filter(s => s.status === TaskStatus.COMPLETED).length;
        return Math.round((completedSubtasks / task.subtasks.length) * 100);
    }
}