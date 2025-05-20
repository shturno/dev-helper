import * as vscode from 'vscode';

interface ThemeDefinition {
    name: string;
    type: 'light' | 'dark';
    colors: {
        [key: string]: string;
    };
    tokenColors: {
        name: string;
        scope: string[];
        settings: {
            foreground?: string;
            background?: string;
            fontStyle?: string;
        };
    }[];
}

export class ThemeManager {
    private static instance: ThemeManager;
    private disposables: vscode.Disposable[] = [];
    private themes: ThemeDefinition[] = [];

    private constructor() {
        this.initializeThemes();
    }

    public static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    private initializeThemes(): void {
        // Tema "Focus Light" - Tema claro otimizado para foco
        this.themes.push({
            name: 'TDAH Focus Light',
            type: 'light',
            colors: {
                'editor.background': '#F8F9FA',
                'editor.foreground': '#2C3E50',
                'editor.lineHighlightBackground': '#E8F0FE',
                'editor.selectionBackground': '#BBDEFB',
                'editorCursor.foreground': '#2196F3',
                'editorWhitespace.foreground': '#E0E0E0',
                'editorIndentGuide.background': '#E0E0E0',
                'editorIndentGuide.activeBackground': '#BBDEFB',
                'editorLineNumber.foreground': '#90A4AE',
                'editorLineNumber.activeForeground': '#2196F3',
                'editorBracketMatch.background': '#BBDEFB',
                'editorBracketMatch.border': '#2196F3',
                'activityBar.background': '#FFFFFF',
                'activityBar.foreground': '#2C3E50',
                'activityBarBadge.background': '#2196F3',
                'activityBarBadge.foreground': '#FFFFFF',
                'sideBar.background': '#FFFFFF',
                'sideBar.foreground': '#2C3E50',
                'sideBarTitle.foreground': '#2C3E50',
                'statusBar.background': '#FFFFFF',
                'statusBar.foreground': '#2C3E50',
                'titleBar.activeBackground': '#FFFFFF',
                'titleBar.activeForeground': '#2C3E50',
                'tab.activeBackground': '#FFFFFF',
                'tab.activeForeground': '#2196F3',
                'tab.inactiveBackground': '#F5F5F5',
                'tab.inactiveForeground': '#90A4AE'
            },
            tokenColors: [
                {
                    name: 'Keywords',
                    scope: ['keyword', 'storage', 'modifier'],
                    settings: {
                        foreground: '#1976D2',
                        fontStyle: 'bold'
                    }
                },
                {
                    name: 'Functions',
                    scope: ['entity.name.function', 'support.function'],
                    settings: {
                        foreground: '#2196F3'
                    }
                },
                {
                    name: 'Strings',
                    scope: ['string', 'string.template'],
                    settings: {
                        foreground: '#388E3C'
                    }
                },
                {
                    name: 'Comments',
                    scope: ['comment', 'punctuation.definition.comment'],
                    settings: {
                        foreground: '#90A4AE',
                        fontStyle: 'italic'
                    }
                },
                {
                    name: 'Variables',
                    scope: ['variable', 'variable.other'],
                    settings: {
                        foreground: '#2C3E50'
                    }
                },
                {
                    name: 'Types',
                    scope: ['entity.name.type', 'support.type'],
                    settings: {
                        foreground: '#7B1FA2',
                        fontStyle: 'bold'
                    }
                }
            ]
        });

        // Tema "Focus Dark" - Tema escuro otimizado para foco
        this.themes.push({
            name: 'TDAH Focus Dark',
            type: 'dark',
            colors: {
                'editor.background': '#1A1A1A',
                'editor.foreground': '#E0E0E0',
                'editor.lineHighlightBackground': '#2C2C2C',
                'editor.selectionBackground': '#3D5AFE',
                'editorCursor.foreground': '#64B5F6',
                'editorWhitespace.foreground': '#2C2C2C',
                'editorIndentGuide.background': '#2C2C2C',
                'editorIndentGuide.activeBackground': '#3D5AFE',
                'editorLineNumber.foreground': '#757575',
                'editorLineNumber.activeForeground': '#64B5F6',
                'editorBracketMatch.background': '#3D5AFE',
                'editorBracketMatch.border': '#64B5F6',
                'activityBar.background': '#1A1A1A',
                'activityBar.foreground': '#E0E0E0',
                'activityBarBadge.background': '#64B5F6',
                'activityBarBadge.foreground': '#FFFFFF',
                'sideBar.background': '#1A1A1A',
                'sideBar.foreground': '#E0E0E0',
                'sideBarTitle.foreground': '#E0E0E0',
                'statusBar.background': '#1A1A1A',
                'statusBar.foreground': '#E0E0E0',
                'titleBar.activeBackground': '#1A1A1A',
                'titleBar.activeForeground': '#E0E0E0',
                'tab.activeBackground': '#1A1A1A',
                'tab.activeForeground': '#64B5F6',
                'tab.inactiveBackground': '#2C2C2C',
                'tab.inactiveForeground': '#757575'
            },
            tokenColors: [
                {
                    name: 'Keywords',
                    scope: ['keyword', 'storage', 'modifier'],
                    settings: {
                        foreground: '#64B5F6',
                        fontStyle: 'bold'
                    }
                },
                {
                    name: 'Functions',
                    scope: ['entity.name.function', 'support.function'],
                    settings: {
                        foreground: '#81D4FA'
                    }
                },
                {
                    name: 'Strings',
                    scope: ['string', 'string.template'],
                    settings: {
                        foreground: '#A5D6A7'
                    }
                },
                {
                    name: 'Comments',
                    scope: ['comment', 'punctuation.definition.comment'],
                    settings: {
                        foreground: '#757575',
                        fontStyle: 'italic'
                    }
                },
                {
                    name: 'Variables',
                    scope: ['variable', 'variable.other'],
                    settings: {
                        foreground: '#E0E0E0'
                    }
                },
                {
                    name: 'Types',
                    scope: ['entity.name.type', 'support.type'],
                    settings: {
                        foreground: '#CE93D8',
                        fontStyle: 'bold'
                    }
                }
            ]
        });

        // Tema "Calm" - Tema suave para reduzir estresse visual
        this.themes.push({
            name: 'TDAH Calm',
            type: 'light',
            colors: {
                'editor.background': '#F5F5F5',
                'editor.foreground': '#4A4A4A',
                'editor.lineHighlightBackground': '#E8EAF6',
                'editor.selectionBackground': '#C5CAE9',
                'editorCursor.foreground': '#5C6BC0',
                'editorWhitespace.foreground': '#E0E0E0',
                'editorIndentGuide.background': '#E0E0E0',
                'editorIndentGuide.activeBackground': '#C5CAE9',
                'editorLineNumber.foreground': '#9E9E9E',
                'editorLineNumber.activeForeground': '#5C6BC0',
                'editorBracketMatch.background': '#C5CAE9',
                'editorBracketMatch.border': '#5C6BC0',
                'activityBar.background': '#F5F5F5',
                'activityBar.foreground': '#4A4A4A',
                'activityBarBadge.background': '#5C6BC0',
                'activityBarBadge.foreground': '#FFFFFF',
                'sideBar.background': '#F5F5F5',
                'sideBar.foreground': '#4A4A4A',
                'sideBarTitle.foreground': '#4A4A4A',
                'statusBar.background': '#F5F5F5',
                'statusBar.foreground': '#4A4A4A',
                'titleBar.activeBackground': '#F5F5F5',
                'titleBar.activeForeground': '#4A4A4A',
                'tab.activeBackground': '#F5F5F5',
                'tab.activeForeground': '#5C6BC0',
                'tab.inactiveBackground': '#EEEEEE',
                'tab.inactiveForeground': '#9E9E9E'
            },
            tokenColors: [
                {
                    name: 'Keywords',
                    scope: ['keyword', 'storage', 'modifier'],
                    settings: {
                        foreground: '#5C6BC0',
                        fontStyle: 'bold'
                    }
                },
                {
                    name: 'Functions',
                    scope: ['entity.name.function', 'support.function'],
                    settings: {
                        foreground: '#7986CB'
                    }
                },
                {
                    name: 'Strings',
                    scope: ['string', 'string.template'],
                    settings: {
                        foreground: '#81C784'
                    }
                },
                {
                    name: 'Comments',
                    scope: ['comment', 'punctuation.definition.comment'],
                    settings: {
                        foreground: '#9E9E9E',
                        fontStyle: 'italic'
                    }
                },
                {
                    name: 'Variables',
                    scope: ['variable', 'variable.other'],
                    settings: {
                        foreground: '#4A4A4A'
                    }
                },
                {
                    name: 'Types',
                    scope: ['entity.name.type', 'support.type'],
                    settings: {
                        foreground: '#9575CD',
                        fontStyle: 'bold'
                    }
                }
            ]
        });
    }

    public async initialize(): Promise<void> {
        // Registrar comando para mudar tema
        this.disposables.push(
            vscode.commands.registerCommand(
                'tdah-dev-helper.changeTheme',
                this.showThemePicker.bind(this)
            )
        );

        // Carregar tema salvo
        const config = vscode.workspace.getConfiguration('tdahDevHelper');
        const savedTheme = config.get<string>('theme');
        
        if (savedTheme) {
            await this.applyTheme(savedTheme);
        }
    }

    private async showThemePicker(): Promise<void> {
        const themes = this.themes.map(theme => ({
            label: theme.name,
            description: `Tema ${theme.type === 'light' ? 'claro' : 'escuro'} otimizado para TDAH`,
            theme
        }));

        const selected = await vscode.window.showQuickPick(themes, {
            placeHolder: 'Selecione um tema otimizado para TDAH'
        });

        if (selected) {
            await this.applyTheme(selected.theme.name);
        }
    }

    private async applyTheme(themeName: string): Promise<void> {
        const theme = this.themes.find(t => t.name === themeName);
        if (!theme) return;

        // Salvar preferência
        const config = vscode.workspace.getConfiguration('tdahDevHelper');
        await config.update('theme', themeName, true);

        // Aplicar tema
        await vscode.workspace.getConfiguration().update(
            'workbench.colorTheme',
            themeName,
            true
        );

        // Mostrar mensagem de sucesso
        vscode.window.showInformationMessage(
            `Tema "${themeName}" aplicado com sucesso!`
        );
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
} 