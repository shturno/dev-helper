import * as vscode from 'vscode';

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
}

export class GamificationManager {
    private static instance: GamificationManager;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private achievements: Achievement[] = [];
    private levelUpRewards: LevelUpReward[] = [];
    private currentUserData: UserData | null = null;

    private constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            98
        );
        this.initializeAchievements();
        this.initializeLevelRewards();
        this.loadUserData();
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

    private loadUserData(): void {
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
                    totalFocusSessions: 0
                };
                this.saveUserData();
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
                totalFocusSessions: 0
            };
        }
    }

    private async saveUserData(): Promise<void> {
        try {
            await this.context.globalState.update('dev-helper-gamification-data', this.currentUserData);
        } catch (error) {
            console.error('Erro ao salvar dados de gamificação:', error);
            vscode.window.showErrorMessage('Erro ao salvar dados de gamificação');
        }
    }

    private initializeAchievements(): void {
        this.achievements = [
            // Conquistas de Tarefas
            {
                id: 'first_task',
                title: 'Primeira Tarefa',
                description: 'Complete sua primeira tarefa',
                icon: '$(trophy)',
                xpReward: 100
            },
            {
                id: 'task_warrior',
                title: 'Guerreiro das Tarefas',
                description: 'Complete 50 tarefas',
                icon: '$(shield)',
                xpReward: 1000
            },
            {
                id: 'task_master',
                title: 'Mestre das Tarefas',
                description: 'Complete 100 tarefas',
                icon: '$(crown)',
                xpReward: 2000
            },
            // Conquistas de Hiperfoco
            {
                id: 'focus_master',
                title: 'Mestre do Foco',
                description: 'Complete 10 sessões de hiperfoco',
                icon: '$(zap)',
                xpReward: 500
            },
            {
                id: 'focus_legend',
                title: 'Lenda do Foco',
                description: 'Complete 50 sessões de hiperfoco',
                icon: '$(star)',
                xpReward: 1500
            },
            // Conquistas de Tempo
            {
                id: 'early_bird',
                title: 'Madrugador',
                description: 'Complete uma tarefa antes das 9h',
                icon: '$(sun)',
                xpReward: 300
            },
            {
                id: 'night_owl',
                title: 'Coruja Noturna',
                description: 'Complete uma tarefa após as 22h',
                icon: '$(moon)',
                xpReward: 300
            },
            // Conquistas de Produtividade
            {
                id: 'streak_3',
                title: 'Em Ritmo',
                description: 'Mantenha um streak de 3 dias',
                icon: '$(flame)',
                xpReward: 400
            },
            {
                id: 'streak_7',
                title: 'Em Chamas',
                description: 'Mantenha um streak de 7 dias',
                icon: '$(flame)',
                xpReward: 1000
            },
            {
                id: 'streak_30',
                title: 'Incendiário',
                description: 'Mantenha um streak de 30 dias',
                icon: '$(flame)',
                xpReward: 5000
            },
            // Conquistas de Subtarefas
            {
                id: 'subtask_master',
                title: 'Mestre das Subtarefas',
                description: 'Complete 100 subtarefas',
                icon: '$(checklist)',
                xpReward: 800
            },
            // Conquistas de Tempo Total
            {
                id: 'time_1h',
                title: 'Primeira Hora',
                description: 'Acumule 1 hora de tempo focado',
                icon: '$(clock)',
                xpReward: 200
            },
            {
                id: 'time_10h',
                title: 'Dez Horas',
                description: 'Acumule 10 horas de tempo focado',
                icon: '$(clock)',
                xpReward: 1000
            },
            {
                id: 'time_100h',
                title: 'Centenário',
                description: 'Acumule 100 horas de tempo focado',
                icon: '$(clock)',
                xpReward: 5000
            }
        ];
    }

    private initializeLevelRewards(): void {
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
        // Verificar conquistas baseadas em tempo
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 9) {
            await this.unlockAchievement('early_bird');
        } else if (hour >= 22 || hour < 5) {
            await this.unlockAchievement('night_owl');
        }

        // Verificar conquistas de streak
        const streak = this.currentUserData?.streak || 0;
        if (streak >= 3) await this.unlockAchievement('streak_3');
        if (streak >= 7) await this.unlockAchievement('streak_7');
        if (streak >= 30) await this.unlockAchievement('streak_30');

        // Verificar conquistas de tempo total
        const totalFocusTime = this.currentUserData?.totalFocusTime || 0;
        const totalFocusHours = totalFocusTime / 60;
        if (totalFocusHours >= 1) await this.unlockAchievement('time_1h');
        if (totalFocusHours >= 10) await this.unlockAchievement('time_10h');
        if (totalFocusHours >= 100) await this.unlockAchievement('time_100h');

        // Verificar conquistas de tarefas
        const totalTasks = this.currentUserData?.totalTasks || 0;
        if (totalTasks >= 50) await this.unlockAchievement('task_warrior');
        if (totalTasks >= 100) await this.unlockAchievement('task_master');

        // Verificar conquistas de subtarefas
        const totalSubtasks = this.currentUserData?.totalSubtasks || 0;
        if (totalSubtasks >= 100) await this.unlockAchievement('subtask_master');

        // Verificar conquistas de hiperfoco
        const totalFocusSessions = this.currentUserData?.totalFocusSessions || 0;
        if (totalFocusSessions >= 10) await this.unlockAchievement('focus_master');
        if (totalFocusSessions >= 50) await this.unlockAchievement('focus_legend');
    }

    private async unlockAchievement(achievementId: string): Promise<void> {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.unlockedAt) {
            achievement.unlockedAt = Date.now();
            await this.addXP(achievement.xpReward);
            vscode.window.showInformationMessage(
                `🏆 Conquista Desbloqueada: ${achievement.title}! +${achievement.xpReward} XP`
            );
        }
    }

    public async onTaskCompleted(xpEarned: number): Promise<void> {
        const oldLevel = this.currentUserData!.level;
        await this.addXP(xpEarned);

        if (this.currentUserData!.level > oldLevel) {
            await this.handleLevelUp();
        }

        // Mostrar notificação de XP
        vscode.window.showInformationMessage(
            `+${xpEarned} XP! Total: ${this.currentUserData!.xp_points}/${this.currentUserData!.xp_for_next_level}`
        );

        this.updateStatusBar();
    }

    private async addXP(amount: number): Promise<void> {
        this.currentUserData!.xp_points += amount;

        // Calcular novo nível
        const newLevel = Math.floor(this.currentUserData!.xp_points / 100) + 1;
        if (newLevel > this.currentUserData!.level) {
            this.currentUserData!.level = newLevel;
            this.currentUserData!.title = this.getLevelTitle(newLevel);
        }

        // Atualizar XP necessário para próximo nível
        this.currentUserData!.xp_for_next_level = newLevel * 100;

        // Salvar dados atualizados
        await this.saveUserData();
    }

    private getLevelTitle(level: number): string {
        if (level >= 30) return 'Mestre';
        if (level >= 20) return 'Adepto';
        if (level >= 10) return 'Iniciado';
        if (level >= 5) return 'Aprendiz';
        return 'Iniciante';
    }

    private async handleLevelUp(): Promise<void> {
        const levelUpReward = this.levelUpRewards.find(
            reward => reward.level === this.currentUserData!.level
        );

        if (levelUpReward) {
            // Mostrar notificação de level up
            vscode.window.showInformationMessage(
                `🎉 Parabéns! Você alcançou o nível ${this.currentUserData!.level}!`,
                'Ver Recompensas'
            ).then(selection => {
                if (selection === 'Ver Recompensas') {
                    this.showLevelUpRewards(levelUpReward);
                }
            });
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
        const { level, xp_points, xp_for_next_level, title, streak, totalFocusTime, totalTasks, totalSubtasks, totalFocusSessions } = this.currentUserData!;
        const progress = Math.round((xp_points / xp_for_next_level) * 100);
        const unlockedAchievements = this.achievements.filter(a => a.unlockedAt);
        const lockedAchievements = this.achievements.filter(a => !a.unlockedAt);
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
                                <div class="achievement-icon">${achievement.icon}</div>
                                <div class="achievement-info">
                                    <h3 class="achievement-title">${achievement.title}</h3>
                                    <p class="achievement-description">${achievement.description}</p>
                                    <div class="achievement-xp">+${achievement.xpReward} XP</div>
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
                                <div class="achievement-icon">${achievement.icon}</div>
                                <div class="achievement-info">
                                    <h3 class="achievement-title">${achievement.title}</h3>
                                    <p class="achievement-description">${achievement.description}</p>
                                    <div class="achievement-xp">+${achievement.xpReward} XP</div>
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

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
    }
} 