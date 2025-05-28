import * as vscode from 'vscode';
import { TaskTracker } from '../tasks/tracker';
import { HyperfocusManager } from '../hyperfocus/manager';
import { AnalysisManager } from '../analysis/manager';
import { TagManager } from '../tasks/tag-manager';
import { ProductivityStats } from '../types/analytics';
import { TaskStatus } from '../tasks/types';

// Helper function to generate nonce
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

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

    private async showTagManagement(): Promise<void> {
        await this.tagManager.reloadTags();
        let tags = this.tagManager.getTags();
        const quickPick = vscode.window.createQuickPick();
        let selectedTag: any;
        let tagToEdit: any;
        let tagToDelete: any;

        const refreshItems = () => {
            tags = this.tagManager.getTags();
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
        };
        refreshItems();

        quickPick.onDidChangeSelection(async ([item]) => {
            if (!item) return;
            switch (item.label) {
                case '$(plus) Criar nova tag':
                    await vscode.commands.executeCommand('dev-helper.createTag');
                    await this.tagManager.reloadTags();
                    refreshItems();
                    this.update();
                    break;
                case '$(pencil) Editar tag':
                    selectedTag = await vscode.window.showQuickPick(
                        tags.map(t => ({ label: t.name, value: t })),
                        { placeHolder: 'Selecione a tag para editar' }
                    );
                    if (selectedTag) {
                        tagToEdit = selectedTag.value;
                        await vscode.commands.executeCommand('dev-helper.editTag', tagToEdit);
                        await this.tagManager.reloadTags();
                        refreshItems();
                        this.update();
                    }
                    break;
                case '$(trash) Excluir tag':
                    selectedTag = await vscode.window.showQuickPick(
                        tags.map(t => ({ label: t.name, value: t })),
                        { placeHolder: 'Selecione a tag para excluir' }
                    );
                    if (selectedTag) {
                        tagToDelete = tags.find(t => t.id === selectedTag.value.id);
                        if (tagToDelete) {
                            await vscode.commands.executeCommand('dev-helper.deleteTag', tagToDelete);
                            await this.tagManager.reloadTags();
                            refreshItems();
                            this.update();
                        }
                    }
                    break;
            }
            quickPick.hide();
        });
        quickPick.show();
    }

    private async showCategoryManagement(): Promise<void> {
        await this.tagManager.reloadCategories();
        let categories = this.tagManager.getCategories();
        const quickPick = vscode.window.createQuickPick();
        let selectedCategory: any;
        let categoryToEdit: any;
        let categoryToDelete: any;

        const refreshItems = () => {
            categories = this.tagManager.getCategories();
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
        };
        refreshItems();

        quickPick.onDidChangeSelection(async ([item]) => {
            if (!item) return;
            switch (item.label) {
                case '$(plus) Criar nova categoria':
                    await vscode.commands.executeCommand('dev-helper.createCategory');
                    await this.tagManager.reloadCategories();
                    refreshItems();
                    this.update();
                    break;
                case '$(pencil) Editar categoria':
                    selectedCategory = await vscode.window.showQuickPick(
                        categories.map(c => ({ label: c.name, value: c })),
                        { placeHolder: 'Selecione a categoria para editar' }
                    );
                    if (selectedCategory) {
                        categoryToEdit = selectedCategory.value;
                        await vscode.commands.executeCommand('dev-helper.editCategory', categoryToEdit);
                        await this.tagManager.reloadCategories();
                        refreshItems();
                        this.update();
                    }
                    break;
                case '$(trash) Excluir categoria':
                    selectedCategory = await vscode.window.showQuickPick(
                        categories.map(c => ({ label: c.name, value: c })),
                        { placeHolder: 'Selecione a categoria para excluir' }
                    );
                    if (selectedCategory) {
                        categoryToDelete = categories.find(c => c.id === selectedCategory.value.id);
                        if (categoryToDelete) {
                            await vscode.commands.executeCommand('dev-helper.deleteCategory', categoryToDelete);
                            await this.tagManager.reloadCategories();
                            refreshItems();
                            this.update();
                        }
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
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getWebviewContent();
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'startFocus':
                    if (this.hyperfocusManager.isActive) {
                        await this.hyperfocusManager.deactivateHyperfocus();
                        await vscode.commands.executeCommand('workbench.action.closePanel');
                        await vscode.commands.executeCommand('workbench.action.closeSidebar');
                    } else {
                        await this.hyperfocusManager.activateHyperfocus({ reason: 'manual' });
                        await vscode.commands.executeCommand('workbench.action.closeSidebar');
                        await vscode.commands.executeCommand('workbench.action.closePanel');
                        // Opcional: impedir reabertura (simples: fecha de novo se abrir)
                        const closeSidebar = vscode.window.onDidChangeWindowState(() => {
                            if (this.hyperfocusManager.isActive) {
                                vscode.commands.executeCommand('workbench.action.closeSidebar');
                                vscode.commands.executeCommand('workbench.action.closePanel');
                            }
                        });
                        this.disposables.push(closeSidebar);
                    }
                    this.update();
                    break;
                case 'createTask':
                    await this.taskTracker.createTask();
                    this.update();
                    break;
                case 'deleteTask':
                    if (message.taskId) {
                        await this.taskTracker.deleteTask(Number(message.taskId));
                        this.update();
                    }
                    break;
                case 'deleteSubtask':
                    if (message.taskId && message.subtaskId) {
                        await this.taskTracker.deleteSubtask(Number(message.taskId), Number(message.subtaskId));
                        this.update();
                    }
                    break;
                case 'createTag':
                    await this.tagManager.createTag();
                    await this.tagManager.reloadTags();
                    this.update();
                    break;
                case 'createCategory':
                    await this.tagManager.createCategory();
                    await this.tagManager.reloadCategories();
                    this.update();
                    break;
                case 'deleteTag':
                    if (message.tag) {
                        await this.tagManager.deleteTag(message.tag);
                        await this.tagManager.reloadTags();
                        this.update();
                    }
                    break;
                case 'editTag':
                    if (message.tag) {
                        await this.tagManager.editTag(message.tag);
                        await this.tagManager.reloadTags();
                        this.update();
                    }
                    break;
                case 'deleteCategory':
                    if (message.category) {
                        await this.tagManager.deleteCategory(message.category);
                        await this.tagManager.reloadCategories();
                        this.update();
                    }
                    break;
                case 'editCategory':
                    if (message.category) {
                        await this.tagManager.editCategory(message.category);
                        await this.tagManager.reloadCategories();
                        this.update();
                    }
                    break;
                case 'editTask':
                    if (message.taskId) {
                        await this.taskTracker.editTask(Number(message.taskId));
                        this.update();
                    }
                    break;
                case 'editSubtask':
                    if (message.taskId && message.subtaskId) {
                        await this.taskTracker.editSubtask(Number(message.taskId), Number(message.subtaskId));
                        this.update();
                    }
                    break;
                case 'dashboardCardClicked':
                    // Exemplo: abrir insights, perfil, etc.
                    // Adicione outros handlers conforme necessário
                    break;
            }
        });
        // Removido o setInterval de update redundante
    }

    public update(): void {
        if (!this.webviewView) return;
        // Re-render full dashboard on each update
        this.webviewView.webview.html = this.getWebviewContent();
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.webviewView = undefined;
    }

    //@ts-expect-error getStats is used only internally for dashboard stats calculation and triggers a TS warning
    private getStats(): ProductivityStats {
        const analysisStats = this.analysisManager.getStats();
        const hyperfocusStats = this.hyperfocusManager.getStats();
        const tasks = this.taskTracker.getTasks();
        const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        return {
            focusTime: hyperfocusStats.todayMinutes,
            streak: analysisStats.streak,
            tasksCompleted: completedTasks,
            completionRate: this.calculateCompletionRate(),
            mostProductiveHour: analysisStats.mostProductiveHour,
            bestDay: analysisStats.bestDay,
            avgTaskDuration: this.calculateAverageTaskDuration(),
            totalFocusTime: hyperfocusStats.totalMinutes,
            insights: analysisStats.insights
        };
    }

    /**
     * Calculate percentage of completed tasks
     */
    private calculateCompletionRate(): number {
        const tasks = this.taskTracker.getTasks();
        if (tasks.length === 0) return 0;
        const done = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        return Math.round((done / tasks.length) * 100);
    }

    /**
     * Calculate average duration of completed tasks
     */
    private calculateAverageTaskDuration(): number {
        const tasks = this.taskTracker.getTasks().filter(t => t.status === TaskStatus.COMPLETED && t.actualTime);
        if (tasks.length === 0) return 0;
        const total = tasks.reduce((sum, t) => sum + (t.actualTime || 0), 0);
        return Math.round(total / tasks.length);
    }

    private getWebviewContent(): string {
        const nonce = getNonce();
        const tasks = this.taskTracker.getTasks();
        // DEBUG: Forçar tarefa de exemplo se não houver nenhuma
        if (!tasks || tasks.length === 0) {
          // placeholder logic removed
        }
        const tags = this.tagManager.getTags();
        const categories = this.tagManager.getCategories();
        const currentTask = (this.taskTracker as any).currentTask || null;
        const statusList = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
        function calcProgress(task: any) {
            if (!task.subtasks || task.subtasks.length === 0) return 0;
            const completed = task.subtasks.filter((s: any) => s.status === 'COMPLETED').length;
            return Math.round((completed / task.subtasks.length) * 100);
        }
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

    .main-action-btn {
      background: linear-gradient(90deg, var(--primary) 60%, var(--accent) 100%);
      color: var(--primary-fg);
      border: none;
      border-radius: var(--radius);
      padding: 9px 22px;
      font-size: 1.08em;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 2px 8px 0 rgba(60,60,60,0.08);
      transition: background 0.2s, box-shadow 0.2s, color 0.2s, transform 0.1s;
      margin-left: 0;
      margin-right: 0;
    }
    .main-action-btn + .main-action-btn {
      margin-left: 12px;
    }
    .main-action-btn:hover, .main-action-btn:focus {
      background: linear-gradient(90deg, var(--accent) 60%, var(--primary) 100%);
      color: var(--primary-fg);
      box-shadow: 0 4px 16px 0 rgba(60,60,60,0.13);
      transform: translateY(-1px) scale(1.03);
    }

    .custom-checkbox {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      font-size: 1em;
      user-select: none;
      position: relative;
      padding-left: 32px;
      margin-bottom: 0;
      min-height: 28px;
      line-height: 1.2;
    }
    .custom-checkbox input[type="checkbox"] {
      opacity: 0;
      position: absolute;
      left: 0;
      top: 50%;
      width: 22px;
      height: 22px;
      margin: 0;
      z-index: 2;
      cursor: pointer;
      transform: translateY(-50%);
    }
    .custom-checkbox .checkmark {
      position: absolute;
      left: 0;
      top: 50%;
      height: 22px;
      width: 22px;
      background-color: var(--input-bg);
      border: 2px solid var(--primary);
      border-radius: 6px;
      transition: background 0.2s, border 0.2s;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateY(-50%);
    }
    .custom-checkbox input[type="checkbox"]:checked ~ .checkmark {
      background-color: var(--primary);
      border-color: var(--accent);
    }
    .custom-checkbox .checkmark:after {
      content: '';
      display: none;
      width: 7px;
      height: 13px;
      border: solid var(--primary-fg);
      border-width: 0 3px 3px 0;
      border-radius: 1px;
      position: absolute;
      left: 7px;
      top: 2px;
      transform: rotate(45deg);
    }
    .custom-checkbox input[type="checkbox"]:checked ~ .checkmark:after {
      display: block;
    }
    .custom-checkbox input[type="checkbox"]:disabled ~ .checkmark {
      background: var(--muted);
      border-color: var(--input-border);
      opacity: 0.7;
    }

  </style>
</head>
<body>
    <script>
      window.tags = ${JSON.stringify(tags)};
      window.categories = ${JSON.stringify(categories)};
    </script>
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
        </div>
        <div style="display:flex;gap:0;justify-content:flex-end;align-items:center;margin-bottom:12px;margin-top:4px;">
          <button id="btn-create-task" class="main-action-btn" title="Criar nova tarefa"><span class="codicon codicon-add"></span>Nova tarefa</button>
          <button id="btn-focus-mode" class="main-action-btn" title="Ativar/Desativar Modo Hiperfoco"><span class="codicon codicon-eye"></span>Foco</button>
        </div>
        <div class="task-list" id="task-list">
          ${tasks.map(task => `
            <article class="task-item${task.id === currentTask?.id ? ' current' : ''}" data-status="${task.status}" data-tag="${task.tags.map((t: any) => t.name).join(',')}" data-category="${task.category ? task.category.name : ''}">
              <h3>${task.title}
                <button class="btn-edit-task" title="Renomear tarefa" data-task-id="${task.id}" style="float:right;margin-left:8px;border:none;background:none;color:var(--text-color);cursor:pointer;">
                  <span class="codicon codicon-edit"></span>
                </button>
                <button class="btn-delete-task" title="Deletar tarefa" data-task-id="${task.id}" style="float:right;border:none;background:none;color:red;cursor:pointer;">
                   <span class="codicon codicon-trash"></span>
                </button>
              </h3>
              <div class="task-tags">
                ${task.tags.map((tag: any) => `<span class="tag" style="background-color: ${tag.color}">${tag.name}</span>`).join('')}
                ${task.category ? `<span class="category" style="background-color: ${task.category.color}">${task.category.name}</span>` : ''}
              </div>
              <div class="task-info">
                <span>Status: ${task.status}</span>
                <span>Prioridade: ${task.priorityCriteria.complexity}</span>
                <span>Impacto: ${task.priorityCriteria.impact}</span>
                ${task.priorityCriteria.deadline ? `<span>Prazo: ${new Date(task.priorityCriteria.deadline).toLocaleDateString()}</span>` : ''}
              </div>
              <div class="task-progress">
                <div class="progress-bar"><div class="progress" style="width: ${calcProgress(task)}%"></div></div>
                <span>${calcProgress(task)}%</span>
              </div>
              <div class="task-todo">
                <label class="custom-checkbox">
                  <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${task.status === 'COMPLETED' ? 'checked disabled' : ''} />
                  <span class="checkmark"></span>
                  Marcar como concluída
                </label>
              </div>
              ${task.subtasks && task.subtasks.length > 0 ? `<ul class="subtask-list">${task.subtasks.map((sub: any) => `
                <li>
                  <input type="checkbox" class="subtask-checkbox" data-task-id="${task.id}" data-subtask-id="${sub.id}" ${sub.status === 'COMPLETED' ? 'checked disabled' : ''} />
                  ${sub.title}
                  <button class="btn-edit-subtask" data-task-id="${task.id}" data-subtask-id="${sub.id}" title="Renomear subtarefa" style="border:none;background:none;color:var(--text-color);cursor:pointer;margin-left:4px;">
                    <span class="codicon codicon-edit"></span>
                  </button>
                  <button class="btn-delete-subtask" data-task-id="${task.id}" data-subtask-id="${sub.id}" title="Deletar subtarefa" style="border:none;background:none;color:red;cursor:pointer;margin-left:4px;">
                     <span class="codicon codicon-trash"></span>
                  </button>
                </li>`).join('')}</ul>` : ''}
            </article>
          `).join('')}
        </div>
      </section>
      <section aria-label="Gestão de Tags e Categorias" class="section">
        <div class="section-title"><span class="codicon codicon-tag"></span> Tags e Categorias</div>
        <div class="tag-category-grid">
          <div class="tag-list">
            <h3><span class="codicon codicon-tag"></span> Tags Disponíveis <button id="btn-create-tag" title="Nova Tag" style="background:none;border:none;color:green;cursor:pointer;"><span class="codicon codicon-add"></span></button></h3>
            ${tags.length === 0 ? '<p class="card-desc">Nenhuma tag cadastrada.</p>' : tags.map(tag => `
              <div class="tag-item">
                <span class="tag-color" style="background-color: ${tag.color}"></span>
                <strong class="tag-name">${tag.name}</strong>
                ${tag.description ? `<span class="tag-desc card-desc">${tag.description}</span>` : ''}
                <button class="btn-edit-tag" title="Renomear tag" data-tag-id="${tag.id}" style="background:none;border:none;color:var(--text-color);cursor:pointer;margin-left:8px;"><span class="codicon codicon-edit"></span></button>
                <button class="btn-delete-tag" title="Deletar tag" data-tag-id="${tag.id}" style="background:none;border:none;color:red;cursor:pointer;margin-left:4px;"><span class="codicon codicon-trash"></span></button>
              </div>
            `).join('')}
          </div>
          <div class="category-list">
            <h3><span class="codicon codicon-folder"></span> Categorias <button id="btn-create-category" title="Nova Categoria" style="background:none;border:none;color:green;cursor:pointer;"><span class="codicon codicon-add"></span></button></h3>
            ${categories.length === 0 ? '<p class="card-desc">Nenhuma categoria cadastrada.</p>' : categories.map(category => `
              <div class="category-item">
                <span class="category-color" style="background-color: ${category.color}"></span>
                <strong class="category-name">${category.name}</strong>
                ${category.description ? `<span class="category-desc card-desc">${category.description}</span>` : ''}
                <button class="btn-edit-category" title="Renomear categoria" data-category-id="${category.id}" style="background:none;border:none;color:var(--text-color);cursor:pointer;margin-left:8px;"><span class="codicon codicon-edit"></span></button>
                <button class="btn-delete-category" title="Deletar categoria" data-category-id="${category.id}" style="background:none;border:none;color:red;cursor:pointer;margin-left:4px;"><span class="codicon codicon-trash"></span></button>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </main>
    <script nonce="${nonce}">
      (function() {
        // Chart.js setup (if needed)
        let focusTimeChartInstance = null;
        let completionRateChartInstance = null;
        const vscode = acquireVsCodeApi();
        function filterTasks() {}
        // Attach all event listeners immediately (not inside DOMContentLoaded)
        const createTaskButton = document.getElementById('btn-create-task');
        const focusModeButton = document.getElementById('btn-focus-mode');
        const btnCreateTag = document.getElementById('btn-create-tag');
        const btnCreateCategory = document.getElementById('btn-create-category');
        const statusFilter = document.getElementById('filter-status');
        const tagFilter = document.getElementById('filter-tag');
        const categoryFilter = document.getElementById('filter-category');
        const statsGrid = document.querySelector('.stats-grid');
        if (createTaskButton) createTaskButton.addEventListener('click', () => vscode.postMessage({ command: 'createTask' }));
        if (focusModeButton) focusModeButton.addEventListener('click', () => vscode.postMessage({ command: 'startFocus' }));
        if (btnCreateTag) btnCreateTag.addEventListener('click', () => vscode.postMessage({ command: 'createTag' }));
        if (btnCreateCategory) btnCreateCategory.addEventListener('click', () => vscode.postMessage({ command: 'createCategory' }));
        if (statusFilter) statusFilter.addEventListener('change', filterTasks);
        if (tagFilter) tagFilter.addEventListener('change', filterTasks);
        if (categoryFilter) categoryFilter.addEventListener('change', filterTasks);
        if (statsGrid) {
          statsGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.clickable-card');
            if (card && card.dataset.action) {
              vscode.postMessage({ command: 'dashboardCardClicked', action: card.dataset.action });
            }
          });
        }
        document.querySelectorAll('.btn-delete-task').forEach(btn => btn.addEventListener('click', e => {
          e.stopPropagation(); const id = btn.getAttribute('data-task-id'); vscode.postMessage({ command: 'deleteTask', taskId: id });
        }));
        document.querySelectorAll('.btn-edit-task').forEach(btn => btn.addEventListener('click', e => {
          e.stopPropagation(); const id = btn.getAttribute('data-task-id'); vscode.postMessage({ command: 'editTask', taskId: id });
        }));
        document.querySelectorAll('.btn-delete-subtask').forEach(btn => btn.addEventListener('click', e => {
          e.stopPropagation(); const taskId = btn.getAttribute('data-task-id'); const subId = btn.getAttribute('data-subtask-id'); vscode.postMessage({ command: 'deleteSubtask', taskId, subtaskId: subId });
        }));
        document.querySelectorAll('.btn-edit-subtask').forEach(btn => btn.addEventListener('click', e => {
          e.stopPropagation(); const taskId = btn.getAttribute('data-task-id'); const subId = btn.getAttribute('data-subtask-id'); vscode.postMessage({ command: 'editSubtask', taskId, subtaskId: subId });
        }));
        // Fix: re-attach event listeners for tag/category edit/delete after every render
        document.querySelectorAll('.btn-delete-tag').forEach(btn => btn.addEventListener('click', e => {
          e.stopPropagation();
          const id = btn.getAttribute('data-tag-id');
          const tag = window.tags?.find?.(t => t.id == id) || null;
          vscode.postMessage({ command: 'deleteTag', tag: tag || { id } });
        }));
        document.querySelectorAll('.btn-edit-tag').forEach(btn => btn.addEventListener('click', e => {
          e.stopPropagation();
          const id = btn.getAttribute('data-tag-id');
          const tag = window.tags?.find?.(t => t.id == id) || null;
          vscode.postMessage({ command: 'editTag', tag: tag || { id } });
        }));
        document.querySelectorAll('.btn-delete-category').forEach(btn => btn.addEventListener('click', e => {
          e.stopPropagation();
          const id = btn.getAttribute('data-category-id');
          const category = window.categories?.find?.(c => c.id == id) || null;
          vscode.postMessage({ command: 'deleteCategory', category: category || { id } });
        }));
        document.querySelectorAll('.btn-edit-category').forEach(btn => btn.addEventListener('click', e => {
          e.stopPropagation();
          const id = btn.getAttribute('data-category-id');
          const category = window.categories?.find?.(c => c.id == id) || null;
          vscode.postMessage({ command: 'editCategory', category: category || { id } });
        }));
        // Checkbox de tarefa: se não há subtarefas, marcar/desmarcar completa a tarefa e barra vai para 100%/0%. Se há subtarefas, só permite marcar se todas subtarefas estiverem completas.
        document.querySelectorAll('.task-checkbox').forEach(cb => cb.addEventListener('change', function() {
          const id = cb.getAttribute('data-task-id');
          const taskElem = cb.closest('.task-item');
          const hasSubtasks = taskElem && taskElem.querySelectorAll('.subtask-checkbox').length > 0;
          if (!hasSubtasks) {
            if (cb.checked) vscode.postMessage({ command: 'completeTask', taskId: id });
            // Atualiza barra e texto imediatamente
            const bar = taskElem.querySelector('.progress');
            const percent = taskElem.querySelector('.task-progress span');
            if (bar && percent) {
              bar.style.width = cb.checked ? '100%' : '0%';
              percent.textContent = cb.checked ? '100%' : '0%';
            }
          } else {
            // Só permite marcar se todas subtarefas estiverem completas
            const allDone = Array.from(taskElem.querySelectorAll('.subtask-checkbox')).every(sub => sub.checked);
            if (cb.checked && allDone) {
              vscode.postMessage({ command: 'completeTask', taskId: id });
            } else {
              cb.checked = allDone;
            }
            // Atualiza barra e texto imediatamente
            const bar = taskElem.querySelector('.progress');
            const percent = taskElem.querySelector('.task-progress span');
            const total = taskElem.querySelectorAll('.subtask-checkbox').length;
            const done = taskElem.querySelectorAll('.subtask-checkbox:checked').length;
            const pct = total ? Math.round((done/total)*100) : 0;
            if (bar && percent) {
              bar.style.width = pct + '%';
              percent.textContent = pct + '%';
            }
          }
        }));
        document.querySelectorAll('.subtask-checkbox').forEach(cb => cb.addEventListener('change', function() {
          const taskId = cb.getAttribute('data-task-id');
          const subId = cb.getAttribute('data-subtask-id');
          if (cb.checked) vscode.postMessage({ command: 'completeSubtask', taskId, subtaskId: subId });
          // Atualiza barra e texto imediatamente
          const taskElem = cb.closest('.task-item');
          const bar = taskElem.querySelector('.progress');
          const percent = taskElem.querySelector('.task-progress span');
          const total = taskElem.querySelectorAll('.subtask-checkbox').length;
          const done = taskElem.querySelectorAll('.subtask-checkbox:checked').length;
          const pct = total ? Math.round((done/total)*100) : 0;
          if (bar && percent) {
            bar.style.width = pct + '%';
            percent.textContent = pct + '%';
          }
          // Se todas subtarefas completas, marca checkbox principal
          const mainCb = taskElem.querySelector('.task-checkbox');
          if (mainCb) mainCb.checked = (done === total);
        }));
      })();
    </script>
  </body>
</html>

        `;
    }
}