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
}

export class GamificationManager {
    private static instance: GamificationManager;
    private statusBarItem: vscode.StatusBarItem;
    private disposables: vscode.Disposable[] = [];
    private achievements: Achievement[] = [];
    private levelUpRewards: LevelUpReward[] = [];
    private currentUserData: UserData | null = null;

    private constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            98
        );
        this.initializeAchievements();
        this.initializeLevelRewards();
        this.initializeUserData();
    }

    public static getInstance(): GamificationManager {
        if (!GamificationManager.instance) {
            GamificationManager.instance = new GamificationManager();
        }
        return GamificationManager.instance;
    }

    private initializeUserData(): void {
        // Inicializar com dados padrão
        this.currentUserData = {
            level: 1,
            xp_points: 0,
            xp_for_next_level: 100,
            title: 'Iniciante'
        };
    }

    private initializeAchievements(): void {
        this.achievements = [
            {
                id: 'first_task',
                title: 'Primeira Tarefa',
                description: 'Complete sua primeira tarefa',
                icon: '$(trophy)',
                xpReward: 100
            },
            {
                id: 'focus_master',
                title: 'Mestre do Foco',
                description: 'Complete 10 sessões de hiperfoco',
                icon: '$(zap)',
                xpReward: 500
            },
            {
                id: 'task_warrior',
                title: 'Guerreiro das Tarefas',
                description: 'Complete 50 tarefas',
                icon: '$(shield)',
                xpReward: 1000
            },
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
            }
        ];
    }

    private initializeLevelRewards(): void {
        this.levelUpRewards = [
            {
                level: 5,
                title: 'Aprendiz',
                description: 'Você está começando sua jornada!',
                rewards: ['Tema personalizado', 'Badge de Aprendiz']
            },
            {
                level: 10,
                title: 'Iniciado',
                description: 'Você está progredindo bem!',
                rewards: ['Novos ícones', 'Badge de Iniciado']
            },
            {
                level: 20,
                title: 'Adepto',
                description: 'Você está se tornando um mestre!',
                rewards: ['Tema exclusivo', 'Badge de Adepto']
            },
            {
                level: 30,
                title: 'Mestre',
                description: 'Você é um verdadeiro mestre da produtividade!',
                rewards: ['Tema premium', 'Badge de Mestre']
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
        // Verificar conquistas localmente
        const hour = new Date().getHours();

        // Verificar conquistas baseadas em tempo
        if (hour >= 5 && hour < 9) {
            this.unlockAchievement('early_bird');
        } else if (hour >= 22 || hour < 5) {
            this.unlockAchievement('night_owl');
        }
    }

    private unlockAchievement(achievementId: string): void {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.unlockedAt) {
            achievement.unlockedAt = Date.now();
            this.addXP(achievement.xpReward);
            vscode.window.showInformationMessage(
                `🏆 Conquista Desbloqueada: ${achievement.title}! +${achievement.xpReward} XP`
            );
        }
    }

    public async onTaskCompleted(xpEarned: number): Promise<void> {
        const oldLevel = this.currentUserData!.level;
        this.addXP(xpEarned);

        if (this.currentUserData!.level > oldLevel) {
            await this.handleLevelUp();
        }

        // Mostrar notificação de XP
        vscode.window.showInformationMessage(
            `+${xpEarned} XP! Total: ${this.currentUserData!.xp_points}/${this.currentUserData!.xp_for_next_level}`
        );

        this.updateStatusBar();
    }

    private addXP(amount: number): void {
        this.currentUserData!.xp_points += amount;

        // Calcular novo nível
        const newLevel = Math.floor(this.currentUserData!.xp_points / 100) + 1;
        if (newLevel > this.currentUserData!.level) {
            this.currentUserData!.level = newLevel;
            this.currentUserData!.title = this.getLevelTitle(newLevel);
        }

        // Atualizar XP necessário para próximo nível
        this.currentUserData!.xp_for_next_level = newLevel * 100;
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
        const { level, xp_points, xp_for_next_level, title } = this.currentUserData!;
        const progress = Math.round((xp_points / xp_for_next_level) * 100);

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
                        margin-bottom: 10px;
                        color: var(--vscode-textLink-foreground);
                    }
                    .level-badge {
                        display: inline-block;
                        padding: 5px 10px;
                        background-color: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        border-radius: 15px;
                        font-size: 0.9em;
                    }
                    .xp-bar-container {
                        width: 100%;
                        height: 20px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 10px;
                        overflow: hidden;
                        margin: 20px 0;
                    }
                    .xp-bar {
                        height: 100%;
                        background-color: var(--vscode-progressBar-background);
                        transition: width 0.3s ease;
                    }
                    .achievements-section {
                        margin-top: 30px;
                    }
                    .achievement-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 15px;
                        margin-top: 15px;
                    }
                    .achievement-card {
                        padding: 15px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 4px;
                        text-align: center;
                    }
                    .achievement-icon {
                        font-size: 2em;
                        margin-bottom: 10px;
                    }
                    .achievement-title {
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .achievement-description {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                    }
                    .achievement-locked {
                        opacity: 0.5;
                    }
                </style>
            </head>
            <body>
                <div class="profile-header">
                    <h1 class="profile-title">${title}</h1>
                    <span class="level-badge">Nível ${level}</span>
                </div>

                <div class="xp-bar-container">
                    <div class="xp-bar" style="width: ${progress}%"></div>
                </div>
                <div style="text-align: center">
                    ${xp_points}/${xp_for_next_level} XP (${progress}%)
                </div>

                <div class="achievements-section">
                    <h2>Conquistas</h2>
                    <div class="achievement-grid">
                        ${this.achievements.map(achievement => `
                            <div class="achievement-card ${achievement.unlockedAt ? '' : 'achievement-locked'}">
                                <div class="achievement-icon">${achievement.icon}</div>
                                <div class="achievement-title">${achievement.title}</div>
                                <div class="achievement-description">${achievement.description}</div>
                                ${achievement.unlockedAt ? 
                                    `<div style="font-size: 0.8em; margin-top: 5px">
                                        Desbloqueado em ${new Date(achievement.unlockedAt).toLocaleDateString()}
                                    </div>` : 
                                    `<div style="font-size: 0.8em; margin-top: 5px">
                                        Recompensa: ${achievement.xpReward} XP
                                    </div>`
                                }
                            </div>
                        `).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.statusBarItem.dispose();
    }
} 