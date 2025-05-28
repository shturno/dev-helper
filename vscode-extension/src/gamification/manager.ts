import * as vscode from 'vscode';
import { Task, TaskPriority } from '../tasks/types';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
    unlockedAt?: number;
}

export interface LevelUpReward {
    level: number;
    title: string;
    description: string;
    rewards: string[];
}

export interface UserData {
    level: number;
    xp_points: number;
    xp_for_next_level: number;
    title: string;
    streak: number;
    totalFocusTime: number;
    totalTasks: number;
    totalSubtasks: number;
    totalFocusSessions: number;
    lastTaskDate: Date | null;
}

export class GamificationManager {
    private static instance: GamificationManager;
    private context!: vscode.ExtensionContext;
    private achievements: Set<string> = new Set();
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private levelUpRewards: LevelUpReward[] = [];
    private currentUserData: UserData | null = null;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.initializeAchievements();
        this.initializeLevelUpRewards();
        this.loadState();
        this.updateStatusBar();
    }

    public static getInstance(context?: vscode.ExtensionContext): GamificationManager {
        if (!GamificationManager.instance) {
            if (!context) {
                throw new Error('Context is required to initialize GamificationManager');
            }
            GamificationManager.instance = new GamificationManager(context);
        }
        return GamificationManager.instance;
    }

    private loadState(): void {
        try {
            const savedData = this.context.globalState.get<UserData>('dev-helper-gamification-data');
            if (savedData) {
                this.currentUserData = savedData;
            } else {
        // Inicializar com dados padrão
        this.currentUserData = {
            level: 1,
            xp_points: 0,
            xp_for_next_level: 100,
                    title: 'Iniciante',
                    streak: 0,
                    totalFocusTime: 0,
                    totalTasks: 0,
                    totalSubtasks: 0,
                    totalFocusSessions: 0,
                    lastTaskDate: null
                };
                this.saveState();
            }
        } catch (error) {
            console.error('Erro ao carregar dados de gamificação:', error);
            vscode.window.showErrorMessage('Erro ao carregar dados de gamificação');
            // Inicializar com dados padrão em caso de erro
            this.currentUserData = {
                level: 1,
                xp_points: 0,
                xp_for_next_level: 100,
                title: 'Iniciante',
                streak: 0,
                totalFocusTime: 0,
                totalTasks: 0,
                totalSubtasks: 0,
                totalFocusSessions: 0,
                lastTaskDate: null
            };
        }
    }

    private async saveState(): Promise<void> {
        try {
            await this.context.globalState.update('dev-helper-gamification-data', this.currentUserData);
        } catch (error) {
            console.error('Erro ao salvar dados de gamificação:', error);
            vscode.window.showErrorMessage('Erro ao salvar dados de gamificação');
        }
    }

    private initializeAchievements(): void {
        this.achievements = new Set([
            // Conquistas de Tarefas
            'first_task',
            'task_warrior',
            'task_master',
            // Conquistas de Hiperfoco
            'focus_master',
            'focus_legend',
            // Conquistas de Tempo
            'early_bird',
            'night_owl',
            // Conquistas de Produtividade
            'streak_3',
            'streak_7',
            'streak_30',
            // Conquistas de Subtarefas
            'subtask_master',
            // Conquistas de Tempo Total
            'time_1h',
            'time_10h',
            'time_100h',
            // Conquistas de prioridade
            'priority_king'
        ]);
    }

    private initializeLevelUpRewards(): void {
        this.levelUpRewards = [
            {
                level: 5,
                title: 'Aprendiz',
                description: 'Você está começando sua jornada!',
                rewards: [
                    'Tema personalizado "Matrix"',
                    'Badge de Aprendiz',
                    'Acesso a estatísticas básicas'
                ]
            },
            {
                level: 10,
                title: 'Iniciado',
                description: 'Você está progredindo bem!',
                rewards: [
                    'Novos ícones personalizados',
                    'Badge de Iniciado',
                    'Acesso a estatísticas avançadas',
                    'Tema "Cyberpunk"'
                ]
            },
            {
                level: 20,
                title: 'Adepto',
                description: 'Você está se tornando um mestre!',
                rewards: [
                    'Tema exclusivo "Neon"',
                    'Badge de Adepto',
                    'Acesso a recursos beta',
                    'Personalização de notificações'
                ]
            },
            {
                level: 30,
                title: 'Mestre',
                description: 'Você é um verdadeiro mestre da produtividade!',
                rewards: [
                    'Tema premium "Quantum"',
                    'Badge de Mestre',
                    'Acesso a todos os recursos',
                    'Personalização completa da interface'
                ]
            },
            {
                level: 50,
                title: 'Lenda',
                description: 'Você transcendeu os limites da produtividade!',
                rewards: [
                    'Tema lendário "Cosmic"',
                    'Badge de Lenda',
                    'Acesso antecipado a novos recursos',
                    'Personalização avançada de temas'
                ]
            }
        ];
    }

    public async initialize(): Promise<void> {
        // Registrar comando para mostrar perfil
        this.disposables.push(
            vscode.commands.registerCommand(
                'tdah-dev-helper.showProfile',
                this.showProfile.bind(this)
            )
        );

        // Atualizar status bar
        this.updateStatusBar();
        this.statusBarItem.show();

        // Verificar conquistas periodicamente
        this.startAchievementCheck();
    }

    private updateStatusBar(): void {
        const { level, xp_points, xp_for_next_level, title } = this.currentUserData!;
        const progress = Math.round((xp_points / xp_for_next_level) * 100);

        this.statusBarItem.text = `$(account) ${title} (Nível ${level}) - ${progress}%`;
        this.statusBarItem.tooltip = `${xp_points}/${xp_for_next_level} XP`;
    }

    private startAchievementCheck(): void {
        // Verificar conquistas a cada 5 minutos
        setInterval(async () => {
            await this.checkAchievements();
        }, 5 * 60 * 1000);
    }

    private async checkAchievements(): Promise<void> {
        try {
            if (!this.currentUserData) {
                throw new Error('Dados do usuário não inicializados');
            }

            const achievementsToCheck = [
                // Conquistas baseadas em tempo
                {
                    id: 'early_bird',
                    condition: () => {
                        const hour = new Date().getHours();
                        return hour >= 5 && hour < 9;
                    }
                },
                {
                    id: 'night_owl',
                    condition: () => {
        const hour = new Date().getHours();
                        return hour >= 22 || hour < 5;
                    }
                },
                // Conquistas de streak
                {
                    id: 'streak_3',
                    condition: () => this.currentUserData!.streak >= 3
                },
                {
                    id: 'streak_7',
                    condition: () => this.currentUserData!.streak >= 7
                },
                {
                    id: 'streak_30',
                    condition: () => this.currentUserData!.streak >= 30
                },
                // Conquistas de tempo total
                {
                    id: 'time_1h',
                    condition: () => (this.currentUserData!.totalFocusTime / 60) >= 1
                },
                {
                    id: 'time_10h',
                    condition: () => (this.currentUserData!.totalFocusTime / 60) >= 10
                },
                {
                    id: 'time_100h',
                    condition: () => (this.currentUserData!.totalFocusTime / 60) >= 100
                },
                // Conquistas de tarefas
                {
                    id: 'task_warrior',
                    condition: () => this.currentUserData!.totalTasks >= 50
                },
                {
                    id: 'task_master',
                    condition: () => this.currentUserData!.totalTasks >= 100
                },
                // Conquistas de subtarefas
                {
                    id: 'subtask_master',
                    condition: () => this.currentUserData!.totalSubtasks >= 100
                },
                // Conquistas de hiperfoco
                {
                    id: 'focus_master',
                    condition: () => this.currentUserData!.totalFocusSessions >= 10
                },
                {
                    id: 'focus_legend',
                    condition: () => this.currentUserData!.totalFocusSessions >= 50
                },
                // Conquistas de prioridade
                {
                    id: 'priority_king',
                    condition: () => this.currentUserData!.totalTasks >= 5 && 
                        this.currentUserData!.totalTasks >= 10 && 
                        this.currentUserData!.totalTasks >= 20 && 
                        this.currentUserData!.totalTasks >= 50
                }
            ];

            // Verificar cada conquista
            for (const achievement of achievementsToCheck) {
                const existingAchievement = this.achievements.has(achievement.id);
                if (!existingAchievement && achievement.condition()) {
                    await this.unlockAchievement(achievement.id);
                }
            }

            // Verificar conquistas especiais
            await this.checkSpecialAchievements();
        } catch (error) {
            console.error('Erro ao verificar conquistas:', error);
        }
    }

    private async checkSpecialAchievements(): Promise<void> {
        if (!this.currentUserData) return;

        try {
            // Conquista de produtividade consistente
            if (this.currentUserData.streak >= 7 && 
                this.currentUserData.totalTasks >= 20 && 
                this.currentUserData.totalFocusTime >= 10 * 60) {
                await this.unlockAchievement('consistent_producer');
            }

            // Conquista de multitarefa
            if (this.currentUserData.totalTasks >= 5 && 
                this.currentUserData.totalSubtasks >= 20) {
                await this.unlockAchievement('task_decomposer');
            }

            // Conquista de foco intenso
            if (this.currentUserData.totalFocusSessions >= 5 && 
                this.currentUserData.totalFocusTime >= 5 * 60) {
                await this.unlockAchievement('deep_focus');
            }

            // Conquista de progresso rápido
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            if (this.currentUserData.lastTaskDate && 
                this.currentUserData.lastTaskDate > lastWeek && 
                this.currentUserData.totalTasks >= 10) {
                await this.unlockAchievement('rapid_progress');
            }
        } catch (error) {
            console.error('Erro ao verificar conquistas especiais:', error);
        }
    }

    private async unlockAchievement(id: string): Promise<void> {
        try {
            if (!this.achievements.has(id)) {
                throw new Error(`Conquista ${id} não encontrada`);
            }

            this.achievements.add(id);
            
            // Adicionar XP
            await this.addXP(this.getAchievementXp(id));

            // Atualizar estatísticas
            const unlockedAchievements = this.achievements.size;
            const totalAchievements = this.achievements.size;
            const completionRate = Math.round((unlockedAchievements / totalAchievements) * 100);

            // Notificar usuário
            const message = `🏆 Conquista Desbloqueada: ${this.getAchievementTitle(id)}!\n` +
                          `+${this.getAchievementXp(id)} XP\n` +
                          `Progresso: ${unlockedAchievements}/${totalAchievements} (${completionRate}%)`;

            vscode.window.showInformationMessage(message, 'Ver Perfil').then(selection => {
                if (selection === 'Ver Perfil') {
                    this.showProfile();
                }
            });

            // Salvar estado atualizado
            await this.saveState();
        } catch (error) {
            console.error('Erro ao desbloquear conquista:', error);
            vscode.window.showErrorMessage('Erro ao registrar conquista');
        }
    }

    private getAchievementXp(id: string): number {
        const xpRewards: { [key: string]: number } = {
            'first_task': 100,
            'task_warrior': 1000,
            'task_master': 2000,
            'focus_master': 500,
            'focus_legend': 1500,
            'early_bird': 300,
            'night_owl': 300,
            'streak_3': 400,
            'streak_7': 1000,
            'streak_30': 5000,
            'subtask_master': 800,
            'time_1h': 200,
            'time_10h': 1000,
            'time_100h': 5000,
            'priority_king': 5000
        };
        return xpRewards[id] || 0;
    }

    private getAchievementTitle(id: string): string {
        const titles: { [key: string]: string } = {
            'first_task': 'Primeira Tarefa',
            'task_warrior': 'Guerreiro das Tarefas',
            'task_master': 'Mestre das Tarefas',
            'focus_master': 'Mestre do Foco',
            'focus_legend': 'Lenda do Foco',
            'early_bird': 'Madrugador',
            'night_owl': 'Coruja Noturna',
            'streak_3': 'Em Ritmo',
            'streak_7': 'Em Chamas',
            'streak_30': 'Incendiário',
            'subtask_master': 'Mestre das Subtarefas',
            'time_1h': 'Primeira Hora',
            'time_10h': 'Dez Horas',
            'time_100h': 'Centenário',
            'priority_king': 'Rei das Prioridades'
        };
        return titles[id] || id;
    }

    private async addXP(amount: number): Promise<void> {
        try {
            if (!this.currentUserData) {
                throw new Error('Dados do usuário não inicializados');
            }

            const oldLevel = this.currentUserData.level;
            this.currentUserData.xp_points += amount;

            // Calcular novo nível usando uma fórmula mais suave
            const newLevel = Math.floor(Math.sqrt(this.currentUserData.xp_points / 100)) + 1;
            
            if (newLevel > this.currentUserData.level) {
                this.currentUserData.level = newLevel;
                this.currentUserData.title = this.getLevelTitle(newLevel);

        // Atualizar XP necessário para próximo nível
                this.currentUserData.xp_for_next_level = Math.pow(newLevel, 2) * 100;

                // Notificar level up
                await this.handleLevelUp(oldLevel, newLevel);
            }

            // Salvar dados atualizados
            await this.saveState();
            this.updateStatusBar();
        } catch (error) {
            console.error('Erro ao adicionar XP:', error);
            throw error;
        }
    }

    private getLevelTitle(level: number): string {
        if (level >= 30) return 'Mestre';
        if (level >= 20) return 'Adepto';
        if (level >= 10) return 'Iniciado';
        if (level >= 5) return 'Aprendiz';
        return 'Iniciante';
    }

    private async handleLevelUp(oldLevel: number, newLevel: number): Promise<void> {
        try {
        const levelUpReward = this.levelUpRewards.find(
                reward => reward.level === newLevel
        );

        if (levelUpReward) {
            // Mostrar notificação de level up
                const message = `🎉 Parabéns! Você subiu do nível ${oldLevel} para o nível ${newLevel}!`;
            vscode.window.showInformationMessage(
                    message,
                    'Ver Recompensas',
                    'Ignorar'
            ).then(selection => {
                if (selection === 'Ver Recompensas') {
                    this.showLevelUpRewards(levelUpReward);
                }
            });

                // Verificar conquistas relacionadas a níveis
                if (newLevel >= 5) await this.unlockAchievement('level_5');
                if (newLevel >= 10) await this.unlockAchievement('level_10');
                if (newLevel >= 20) await this.unlockAchievement('level_20');
                if (newLevel >= 30) await this.unlockAchievement('level_30');
                if (newLevel >= 50) await this.unlockAchievement('level_50');
            }
        } catch (error) {
            console.error('Erro ao processar level up:', error);
        }
    }

    private showLevelUpRewards(reward: LevelUpReward): void {
        const panel = vscode.window.createWebviewPanel(
            'levelUpRewards',
            `Recompensas - Nível ${reward.level}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getLevelUpRewardsContent(reward);
    }

    private getLevelUpRewardsContent(reward: LevelUpReward): string {
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
                    .reward-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .reward-title {
                        font-size: 2em;
                        margin-bottom: 10px;
                        color: var(--vscode-textLink-foreground);
                    }
                    .reward-description {
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 20px;
                    }
                    .rewards-list {
                        list-style: none;
                        padding: 0;
                    }
                    .reward-item {
                        display: flex;
                        align-items: center;
                        padding: 15px;
                        margin-bottom: 10px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                    }
                    .reward-icon {
                        font-size: 1.5em;
                        margin-right: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="reward-header">
                    <h1 class="reward-title">${reward.title}</h1>
                    <p class="reward-description">${reward.description}</p>
                </div>

                <h2>Suas Recompensas:</h2>
                <ul class="rewards-list">
                    ${reward.rewards.map(r => `
                        <li class="reward-item">
                            <span class="reward-icon">$(gift)</span>
                            <span>${r}</span>
                        </li>
                    `).join('')}
                </ul>
            </body>
            </html>
        `;
    }

    public showProfile(): void {
        const panel = vscode.window.createWebviewPanel(
            'userProfile',
            'Perfil do Desenvolvedor',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getProfileContent();
    }

    private getProfileContent(): string {
        const { level, xp_points, xp_for_next_level, title, streak, totalFocusTime, totalTasks, totalFocusSessions } = this.currentUserData!;
        const progress = Math.round((xp_points / xp_for_next_level) * 100);
        const unlockedAchievements = Array.from(this.achievements);
        const lockedAchievements = Array.from(this.achievements).filter(id => !this.achievements.has(id));
        const nextLevelReward = this.levelUpRewards.find(r => r.level > level);

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
                    .profile-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .profile-title {
                        font-size: 2em;
                        margin: 0;
                        color: var(--vscode-textLink-foreground);
                    }
                    .profile-subtitle {
                        color: var(--vscode-descriptionForeground);
                        margin: 5px 0;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 30px;
                    }
                    .stat-card {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                    }
                    .stat-value {
                        font-size: 1.5em;
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                    }
                    .stat-label {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                    }
                    .progress-container {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 10px;
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    .progress-bar {
                        width: 100%;
                        height: 20px;
                        background: var(--vscode-progressBar-background);
                        border-radius: 10px;
                        overflow: hidden;
                        margin: 10px 0;
                    }
                    .progress-fill {
                        height: 100%;
                        background: var(--vscode-textLink-foreground);
                        transition: width 0.3s ease;
                    }
                    .achievements-section {
                        margin-bottom: 30px;
                    }
                    .section-title {
                        font-size: 1.2em;
                        margin-bottom: 15px;
                        color: var(--vscode-textLink-foreground);
                    }
                    .achievements-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 15px;
                    }
                    .achievement-card {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        padding: 15px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    .achievement-icon {
                        font-size: 1.5em;
                    }
                    .achievement-info {
                        flex: 1;
                    }
                    .achievement-title {
                        font-weight: bold;
                        margin: 0;
                    }
                    .achievement-description {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                        margin: 5px 0;
                    }
                    .achievement-xp {
                        color: var(--vscode-textLink-foreground);
                        font-size: 0.9em;
                    }
                    .achievement-locked {
                        opacity: 0.6;
                    }
                    .next-reward {
                        background: var(--vscode-editor-inactiveSelectionBackground);
                        padding: 20px;
                        border-radius: 8px;
                        margin-top: 20px;
                    }
                    .next-reward-title {
                        color: var(--vscode-textLink-foreground);
                        margin: 0 0 10px 0;
                    }
                    .rewards-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    .reward-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin: 5px 0;
                    }
                    .reward-icon {
                        color: var(--vscode-textLink-foreground);
                    }
                </style>
            </head>
            <body>
                <div class="profile-header">
                    <h1 class="profile-title">${title}</h1>
                    <p class="profile-subtitle">Nível ${level}</p>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${streak}</div>
                        <div class="stat-label">Dias Consecutivos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.round(totalFocusTime / 60)}h</div>
                        <div class="stat-label">Tempo Total Focado</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalTasks}</div>
                        <div class="stat-label">Tarefas Completadas</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${totalFocusSessions}</div>
                        <div class="stat-label">Sessões de Hiperfoco</div>
                    </div>
                </div>

                <div class="progress-container">
                    <div class="section-title">Progresso para o Próximo Nível</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div style="text-align: center">
                    ${xp_points}/${xp_for_next_level} XP (${progress}%)
                    </div>
                </div>

                <div class="achievements-section">
                    <div class="section-title">Conquistas Desbloqueadas</div>
                    <div class="achievements-grid">
                        ${unlockedAchievements.map(achievement => `
                            <div class="achievement-card">
                                <div class="achievement-icon">${this.getAchievementIcon(achievement)}</div>
                                <div class="achievement-info">
                                    <h3 class="achievement-title">${this.getAchievementTitle(achievement)}</h3>
                                    <p class="achievement-description">${this.getAchievementDescription(achievement)}</p>
                                    <div class="achievement-xp">+${this.getAchievementXp(achievement)} XP</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="achievements-section">
                    <div class="section-title">Conquistas Pendentes</div>
                    <div class="achievements-grid">
                        ${lockedAchievements.map(achievement => `
                            <div class="achievement-card achievement-locked">
                                <div class="achievement-icon">${this.getAchievementIcon(achievement)}</div>
                                <div class="achievement-info">
                                    <h3 class="achievement-title">${this.getAchievementTitle(achievement)}</h3>
                                    <p class="achievement-description">${this.getAchievementDescription(achievement)}</p>
                                    <div class="achievement-xp">+${this.getAchievementXp(achievement)} XP</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${nextLevelReward ? `
                    <div class="next-reward">
                        <h2 class="next-reward-title">Próxima Recompensa - Nível ${nextLevelReward.level}</h2>
                        <p>${nextLevelReward.description}</p>
                        <ul class="rewards-list">
                            ${nextLevelReward.rewards.map(reward => `
                                <li class="reward-item">
                                    <span class="reward-icon">$(gift)</span>
                                    <span>${reward}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </body>
            </html>
        `;
    }

    private getAchievementIcon(id: string): string {
        const icons: { [key: string]: string } = {
            'first_task': '$(trophy)',
            'task_warrior': '$(shield)',
            'task_master': '$(crown)',
            'focus_master': '$(zap)',
            'focus_legend': '$(star)',
            'early_bird': '$(sun)',
            'night_owl': '$(moon)',
            'streak_3': '$(flame)',
            'streak_7': '$(flame)',
            'streak_30': '$(flame)',
            'subtask_master': '$(checklist)',
            'time_1h': '$(clock)',
            'time_10h': '$(clock)',
            'time_100h': '$(clock)',
            'priority_king': '$(crown)'
        };
        return icons[id] || '$(question)';
    }

    private getAchievementDescription(id: string): string {
        const descriptions: { [key: string]: string } = {
            'first_task': 'Complete sua primeira tarefa',
            'task_warrior': 'Complete 50 tarefas',
            'task_master': 'Complete 100 tarefas',
            'focus_master': 'Complete 10 sessões de hiperfoco',
            'focus_legend': 'Complete 50 sessões de hiperfoco',
            'early_bird': 'Complete uma tarefa antes das 9h',
            'night_owl': 'Complete uma tarefa após as 22h',
            'streak_3': 'Mantenha um streak de 3 dias',
            'streak_7': 'Mantenha um streak de 7 dias',
            'streak_30': 'Mantenha um streak de 30 dias',
            'subtask_master': 'Complete 100 subtarefas',
            'time_1h': 'Acumule 1 hora de tempo focado',
            'time_10h': 'Acumule 10 horas de tempo focado',
            'time_100h': 'Acumule 100 horas de tempo focado',
            'priority_king': 'Complete 5 tarefas urgentes'
        };
        return descriptions[id] || 'Descrição não disponível';
    }

    public async getUserData(): Promise<UserData> {
        return this.currentUserData || {
            level: 1,
            xp_points: 0,
            xp_for_next_level: 100,
            title: 'Iniciante',
            streak: 0,
            totalFocusTime: 0,
            totalTasks: 0,
            totalSubtasks: 0,
            totalFocusSessions: 0,
            lastTaskDate: null
        };
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
    }

    public async onTaskCompleted(task: Task): Promise<void> {
        try {
            if (!this.currentUserData) {
                throw new Error('Dados do usuário não inicializados');
            }

            // Atualizar estatísticas básicas
            this.currentUserData.totalTasks++;
            this.currentUserData.totalSubtasks += task.subtasks.length;

            // Atualizar streak
            const today = new Date().toISOString().split('T')[0];
            const lastTaskDate = this.currentUserData.lastTaskDate?.toISOString().split('T')[0];
            
            if (lastTaskDate === today) {
                // Já completou uma tarefa hoje, não precisa atualizar o streak
            } else if (!lastTaskDate || 
                      new Date(today).getTime() - new Date(lastTaskDate).getTime() === 24 * 60 * 60 * 1000) {
                // Última tarefa foi ontem, incrementar streak
                this.currentUserData.streak++;
            } else {
                // Quebrou o streak
                this.currentUserData.streak = 1;
            }

            // Atualizar última data de tarefa
            this.currentUserData.lastTaskDate = new Date();

            // Adicionar XP baseado na complexidade e prioridade da tarefa
            const baseXP = 50;
            const complexityMultiplier = task.priorityCriteria.complexity;
            const priorityMultiplier = task.priority === TaskPriority.URGENT ? 2 :
                                     task.priority === TaskPriority.HIGH ? 1.5 :
                                     task.priority === TaskPriority.MEDIUM ? 1.2 : 1;

            const xpGained = Math.round(baseXP * complexityMultiplier * priorityMultiplier);
            await this.addXP(xpGained);

            // Verificar conquistas específicas de tarefas
            if (this.currentUserData.totalTasks === 1) {
                await this.unlockAchievement('first_task');
            }
            if (this.currentUserData.totalTasks >= 50) {
                await this.unlockAchievement('task_warrior');
            }
            if (this.currentUserData.totalTasks >= 100) {
                await this.unlockAchievement('task_master');
            }
            if (this.currentUserData.totalSubtasks >= 100) {
                await this.unlockAchievement('subtask_master');
            }

            // Notificar streak a cada múltiplo de 5 dias
            if (this.currentUserData.streak && this.currentUserData.streak % 5 === 0) {
                const { Notifier } = await import('../notifications/notifier');
                Notifier.congratulateStreak(this.currentUserData.streak);
            }

            // Salvar estado atualizado
            await this.saveState();
            this.updateStatusBar();

        } catch (error) {
            console.error('Erro ao processar tarefa completada:', error);
            throw error;
        }
    }
}