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
  <style>
    :root {
      --radius: 8px;
      --card-bg: var(--vscode-sideBar-background);
      --card-border: var(--vscode-panel-border);
      --card-shadow: 0 2px 8px 0 var(--vscode-widget-shadow,rgba(0,0,0,0.08));
      --primary: var(--vscode-editor-selectionBackground);
      --primary-fg: var(--vscode-editor-foreground);
      --muted: var(--vscode-editor-inactiveSelectionBackground);
      --muted-fg: var(--vscode-descriptionForeground);
      --accent: var(--vscode-editor-selectionHighlightBackground, #6c63ff);
    }
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      margin: 0;
      padding: 0;
    }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 16px 32px 16px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .dashboard-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .dashboard-header .codicon {
      font-size: 2rem;
      color: var(--primary);
      opacity: 0.7;
    }
    .dashboard-title {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -1px;
      color: var(--primary-fg);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      box-shadow: var(--card-shadow);
      padding: 20px 18px 18px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 110px;
      position: relative;
      transition: box-shadow 0.2s;
    }
    .card:hover {
      box-shadow: 0 4px 16px 0 var(--vscode-widget-shadow,rgba(0,0,0,0.14));
    }
    .card .codicon {
      position: absolute;
      top: 18px;
      right: 18px;
      font-size: 1.5rem;
      opacity: 0.15;
      pointer-events: none;
    }
    .card-title {
      margin: 0 0 2px 0;
      font-size: 1rem;
      color: var(--muted-fg);
      font-weight: 500;
    }
    .card-value {
      margin: 0;
      font-size: 2rem;
      font-weight: bold;
      color: var(--primary-fg);
    }
    .card-desc {
      color: var(--muted-fg);
      font-size: 0.95em;
    }
    .section {
      margin-top: 12px;
      margin-bottom: 8px;
    }
    .section-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 10px;
      color: var (--primary-fg);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filters {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .filters label {
      font-size: 0.95em;
      color: var(--muted-fg);
    }
    .filters select, .filters button {
      border-radius: var(--radius);
      border: 1px solid var(--card-border);
      background: var(--card-bg);
      color: var(--primary-fg);
      padding: 4px 10px;
      font-size: 1em;
      margin-right: 4px;
    }
    .filters button {
      background: var(--primary);
      color: var(--primary-fg);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .filters button:hover {
      background: var(--accent);
    }
    .tag, .category {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.95em;
      margin: 2px 4px 2px 0;
      color: #fff;
      font-weight: 500;
    }
    .tag-list, .category-list {
      margin: 10px 0;
      padding: 10px;
      background: var(--card-bg);
      border-radius: 6px;
      border: 1px solid var(--card-border);
    }
    .tag-item, .category-item {
      display: flex;
      align-items: center;
      margin: 5px 0;
      gap: 8px;
    }
    .tag-color, .category-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      margin-right: 4px;
      border: 1px solid var(--card-border);
    }
    .task-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 8px;
    }
    .task-item {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      padding: 14px 16px 10px 16px;
      box-shadow: 0 1px 4px 0 var(--vscode-widget-shadow,rgba(0,0,0,0.04));
      margin-bottom: 2px;
      position: relative;
      transition: box-shadow 0.2s;
    }
    .task-item.current {
      border: 2px solid var(--primary);
      box-shadow: 0 0 0 2px var(--primary);
    }
    .task-item h3 {
      margin: 0 0 4px 0;
      font-size: 1.1rem;
      font-weight: 600;
    }
    .task-tags {
      margin-bottom: 4px;
    }
    .task-info {
      font-size: 0.95em;
      color: var(--muted-fg);
      margin-bottom: 4px;
    }
    .task-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--muted);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--accent));
      border-radius: 4px;
      transition: width 0.4s cubic-bezier(.4,1.4,.6,1);
    }
    @media (max-width: 700px) {
      main { padding: 8px; }
      .stats-grid { grid-template-columns: 1fr; }
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
        <div class="card"><span class="codicon codicon-clock"></span><div class="card-title">Tempo Foco</div><div class="card-value" id="focus-time">0 minutos</div><div class="card-desc">Hoje</div></div>
        <div class="card"><span class="codicon codicon-flame"></span><div class="card-title">Sequência</div><div class="card-value" id="streak">0 dias</div><div class="card-desc">Streak</div></div>
        <div class="card"><span class="codicon codicon-check"></span><div class="card-title">Tarefas Concluídas</div><div class="card-value" id="tasks-completed">0</div></div>
        <div class="card"><span class="codicon codicon-rocket"></span><div class="card-title">Taxa de Conclusão</div><div class="card-value" id="completion-rate">0%</div></div>
        <div class="card"><span class="codicon codicon-calendar"></span><div class="card-title">Hora Mais Produtiva</div><div class="card-value" id="most-productive-hour">--:--</div></div>
        <div class="card"><span class="codicon codicon-star"></span><div class="card-title">Melhor Dia</div><div class="card-value" id="best-day">--</div></div>
        <div class="card"><span class="codicon codicon-timer"></span><div class="card-title">Duração Média</div><div class="card-value" id="avg-task-duration">0 minutos</div></div>
        <div class="card"><span class="codicon codicon-history"></span><div class="card-title">Tempo Total Foco</div><div class="card-value" id="total-focus-time">0 minutos</div></div>
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
              <span>Status: ${task.status}</span> &nbsp;|
              <span>Prioridade: ${task.priorityCriteria.complexity}</span> &nbsp;|
              <span>Impacto: ${task.priorityCriteria.impact}</span>
              ${task.priorityCriteria.deadline ? `<span> | Prazo: ${task.priorityCriteria.deadline.toLocaleDateString()}</span>` : ''}
            </div>
            <div class="task-progress">
              <div class="progress-bar"><div class="progress" style="width: ${this.calculateTaskProgress(task)}%"></div></div>
              <span>${this.calculateTaskProgress(task)}%</span>
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <section aria-label="Tags e Categorias" class="section">
      <div class="section-title"><span class="codicon codicon-tag"></span> Tags e Categorias</div>
      <div class="tag-list">
        <h3 style="margin:0 0 6px 0;font-size:1em;">Tags Disponíveis</h3>
        ${tags.length === 0 ? '<span class="card-desc">Nenhuma tag cadastrada.</span>' : tags.map(tag => `
          <div class="tag-item">
            <div class="tag-color" style="background-color: ${tag.color}"></div>
            <span class="tag" style="background-color: ${tag.color}">${tag.name}</span>
            ${tag.description ? `<span class="card-desc">${tag.description}</span>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="category-list">
        <h3 style="margin:0 0 6px 0;font-size:1em;">Categorias</h3>
        ${categories.length === 0 ? '<span class="card-desc">Nenhuma categoria cadastrada.</span>' : categories.map(category => `
          <div class="category-item">
            <div class="category-color" style="background-color: ${category.color}"></div>
            <span class="category" style="background-color: ${category.color}">${category.name}</span>
            ${category.description ? `<span class="card-desc">${category.description}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  </main>
  <script>
    const vscode = acquireVsCodeApi();
    const statusFilter = document.getElementById('filter-status');
    const tagFilter = document.getElementById('filter-tag');
    const categoryFilter = document.getElementById('filter-category');
    const taskList = document.getElementById('task-list');
    function filterTasks() {
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
    statusFilter.addEventListener('change', filterTasks);
    tagFilter.addEventListener('change', filterTasks);
    categoryFilter.addEventListener('change', filterTasks);
    document.getElementById('btn-create-task').onclick = function() {
      vscode.postMessage({ command: 'createTask' });
    };
    document.getElementById('btn-focus-mode').onclick = function() {
      vscode.postMessage({ command: 'startFocus' });
    };
    window.addEventListener('message', function(event) {
      var message = event.data;
      switch (message.type) {
        case 'update':
          if (message.stats) {
            var stats = message.stats;
            var elements = {
              focusTime: document.getElementById('focus-time'),
              streak: document.getElementById('streak'),
              tasksCompleted: document.getElementById('tasks-completed'),
              completionRate: document.getElementById('completion-rate'),
              mostProductiveHour: document.getElementById('most-productive-hour'),
              bestDay: document.getElementById('best-day'),
              avgTaskDuration: document.getElementById('avg-task-duration'),
              totalFocusTime: document.getElementById('total-focus-time')
            };
            if (elements.focusTime) elements.focusTime.textContent = stats.focusTime + ' minutos';
            if (elements.streak) elements.streak.textContent = stats.streak + ' dias';
            if (elements.tasksCompleted) elements.tasksCompleted.textContent = stats.tasksCompleted;
            if (elements.completionRate) elements.completionRate.textContent = stats.completionRate + '%';
            if (elements.mostProductiveHour) elements.mostProductiveHour.textContent = stats.mostProductiveHour + 'h';
            if (elements.bestDay) elements.bestDay.textContent = stats.bestDay;
            if (elements.avgTaskDuration) elements.avgTaskDuration.textContent = stats.avgTaskDuration + ' minutos';
            if (elements.totalFocusTime) elements.totalFocusTime.textContent = stats.totalFocusTime + ' minutos';
          }
          break;
      }
    });
  </script>
</body>
</html>
        `;
    }

    private calculateTaskProgress(task: Task): number {
        if (task.subtasks.length === 0) return 0;
        const completedSubtasks = task.subtasks.filter(s => s.status === TaskStatus.COMPLETED).length;
        return Math.round((completedSubtasks / task.subtasks.length) * 100);
    }
}