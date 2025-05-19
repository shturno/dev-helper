import * as vscode from 'vscode';

export interface ThemeConfig {
    id: string;
    name: string;
    description: string;
    type: 'light' | 'dark' | 'high-contrast';
    colors: {
        editorBackground: string;
        editorForeground: string;
        activityBarBackground: string;
        activityBarForeground: string;
        statusBarBackground: string;
        statusBarForeground: string;
        titleBarBackground: string;
        titleBarForeground: string;
        sideBarBackground: string;
        sideBarForeground: string;
        focusBorder: string;
        selectionBackground: string;
        selectionForeground: string;
        lineHighlightBackground: string;
        lineHighlightBorder: string;
        cursorColor: string;
        wordHighlightBackground: string;
        wordHighlightBorder: string;
        findMatchBackground: string;
        findMatchBorder: string;
        findRangeHighlightBackground: string;
        findRangeHighlightBorder: string;
        inactiveSelectionBackground: string;
        inactiveSelectionForeground: string;
        minimapBackground: string;
        minimapSelectionHighlight: string;
        minimapFindMatchHighlight: string;
        minimapErrorHighlight: string;
        minimapWarningHighlight: string;
        minimapGutterAddedBackground: string;
        minimapGutterModifiedBackground: string;
        minimapGutterDeletedBackground: string;
        editorGroupHeaderBackground: string;
        editorGroupHeaderForeground: string;
        editorGroupHeaderTabsBackground: string;
        editorGroupHeaderTabsForeground: string;
        editorGroupHeaderTabsBorder: string;
        editorGroupHeaderTabsActiveBackground: string;
        editorGroupHeaderTabsActiveForeground: string;
        editorGroupHeaderTabsActiveBorder: string;
        editorGroupHeaderTabsInactiveBackground: string;
        editorGroupHeaderTabsInactiveForeground: string;
        editorGroupHeaderTabsInactiveBorder: string;
        editorGroupHeaderTabsHoverBackground: string;
        editorGroupHeaderTabsHoverForeground: string;
        editorGroupHeaderTabsHoverBorder: string;
        editorGroupHeaderTabsUnfocusedBackground: string;
        editorGroupHeaderTabsUnfocusedForeground: string;
        editorGroupHeaderTabsUnfocusedBorder: string;
        editorGroupHeaderTabsUnfocusedActiveBackground: string;
        editorGroupHeaderTabsUnfocusedActiveForeground: string;
        editorGroupHeaderTabsUnfocusedActiveBorder: string;
        editorGroupHeaderTabsUnfocusedInactiveBackground: string;
        editorGroupHeaderTabsUnfocusedInactiveForeground: string;
        editorGroupHeaderTabsUnfocusedInactiveBorder: string;
        editorGroupHeaderTabsUnfocusedHoverBackground: string;
        editorGroupHeaderTabsUnfocusedHoverForeground: string;
        editorGroupHeaderTabsUnfocusedHoverBorder: string;
    };
    tokenColors: Array<{
        name: string;
        scope: string[];
        settings: {
            foreground?: string;
            background?: string;
            fontStyle?: string;
        };
    }>;
}

export class ThemeManager {
    private static instance: ThemeManager;
    private config: vscode.WorkspaceConfiguration;
    private disposables: vscode.Disposable[] = [];
    private currentTheme: ThemeConfig | null = null;

    private readonly themes: ThemeConfig[] = [
        {
            id: 'tdah-light',
            name: 'TDAH Light',
            description: 'Tema claro otimizado para desenvolvedores com TDAH',
            type: 'light',
            colors: {
                editorBackground: '#FFFFFF',
                editorForeground: '#2C3E50',
                activityBarBackground: '#F5F5F5',
                activityBarForeground: '#2C3E50',
                statusBarBackground: '#F5F5F5',
                statusBarForeground: '#2C3E50',
                titleBarBackground: '#F5F5F5',
                titleBarForeground: '#2C3E50',
                sideBarBackground: '#F5F5F5',
                sideBarForeground: '#2C3E50',
                focusBorder: '#3498DB',
                selectionBackground: '#3498DB33',
                selectionForeground: '#2C3E50',
                lineHighlightBackground: '#F8F9FA',
                lineHighlightBorder: '#E9ECEF',
                cursorColor: '#3498DB',
                wordHighlightBackground: '#3498DB22',
                wordHighlightBorder: '#3498DB44',
                findMatchBackground: '#F1C40F33',
                findMatchBorder: '#F1C40F66',
                findRangeHighlightBackground: '#F1C40F22',
                findRangeHighlightBorder: '#F1C40F44',
                inactiveSelectionBackground: '#3498DB22',
                inactiveSelectionForeground: '#2C3E50',
                minimapBackground: '#F5F5F5',
                minimapSelectionHighlight: '#3498DB33',
                minimapFindMatchHighlight: '#F1C40F33',
                minimapErrorHighlight: '#E74C3C33',
                minimapWarningHighlight: '#F39C1233',
                minimapGutterAddedBackground: '#2ECC7133',
                minimapGutterModifiedBackground: '#F1C40F33',
                minimapGutterDeletedBackground: '#E74C3C33',
                editorGroupHeaderBackground: '#F5F5F5',
                editorGroupHeaderForeground: '#2C3E50',
                editorGroupHeaderTabsBackground: '#F5F5F5',
                editorGroupHeaderTabsForeground: '#2C3E50',
                editorGroupHeaderTabsBorder: '#E9ECEF',
                editorGroupHeaderTabsActiveBackground: '#FFFFFF',
                editorGroupHeaderTabsActiveForeground: '#2C3E50',
                editorGroupHeaderTabsActiveBorder: '#3498DB',
                editorGroupHeaderTabsInactiveBackground: '#F5F5F5',
                editorGroupHeaderTabsInactiveForeground: '#95A5A6',
                editorGroupHeaderTabsInactiveBorder: '#E9ECEF',
                editorGroupHeaderTabsHoverBackground: '#FFFFFF',
                editorGroupHeaderTabsHoverForeground: '#2C3E50',
                editorGroupHeaderTabsHoverBorder: '#3498DB',
                editorGroupHeaderTabsUnfocusedBackground: '#F5F5F5',
                editorGroupHeaderTabsUnfocusedForeground: '#95A5A6',
                editorGroupHeaderTabsUnfocusedBorder: '#E9ECEF',
                editorGroupHeaderTabsUnfocusedActiveBackground: '#FFFFFF',
                editorGroupHeaderTabsUnfocusedActiveForeground: '#2C3E50',
                editorGroupHeaderTabsUnfocusedActiveBorder: '#3498DB',
                editorGroupHeaderTabsUnfocusedInactiveBackground: '#F5F5F5',
                editorGroupHeaderTabsUnfocusedInactiveForeground: '#95A5A6',
                editorGroupHeaderTabsUnfocusedInactiveBorder: '#E9ECEF',
                editorGroupHeaderTabsUnfocusedHoverBackground: '#FFFFFF',
                editorGroupHeaderTabsUnfocusedHoverForeground: '#2C3E50',
                editorGroupHeaderTabsUnfocusedHoverBorder: '#3498DB'
            },
            tokenColors: [
                {
                    name: 'Keywords',
                    scope: ['keyword', 'storage', 'type'],
                    settings: {
                        foreground: '#3498DB',
                        fontStyle: 'bold'
                    }
                },
                {
                    name: 'Functions',
                    scope: ['entity.name.function', 'support.function'],
                    settings: {
                        foreground: '#2ECC71',
                        fontStyle: 'bold'
                    }
                },
                {
                    name: 'Strings',
                    scope: ['string', 'string.template'],
                    settings: {
                        foreground: '#E67E22'
                    }
                },
                {
                    name: 'Comments',
                    scope: ['comment', 'punctuation.definition.comment'],
                    settings: {
                        foreground: '#95A5A6',
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
                    name: 'Numbers',
                    scope: ['constant.numeric'],
                    settings: {
                        foreground: '#9B59B6'
                    }
                }
            ]
        },
        {
            id: 'tdah-dark',
            name: 'TDAH Dark',
            description: 'Tema escuro otimizado para desenvolvedores com TDAH',
            type: 'dark',
            colors: {
                editorBackground: '#1E1E1E',
                editorForeground: '#ECF0F1',
                activityBarBackground: '#252526',
                activityBarForeground: '#ECF0F1',
                statusBarBackground: '#252526',
                statusBarForeground: '#ECF0F1',
                titleBarBackground: '#252526',
                titleBarForeground: '#ECF0F1',
                sideBarBackground: '#252526',
                sideBarForeground: '#ECF0F1',
                focusBorder: '#3498DB',
                selectionBackground: '#3498DB33',
                selectionForeground: '#ECF0F1',
                lineHighlightBackground: '#2C2C2C',
                lineHighlightBorder: '#3C3C3C',
                cursorColor: '#3498DB',
                wordHighlightBackground: '#3498DB22',
                wordHighlightBorder: '#3498DB44',
                findMatchBackground: '#F1C40F33',
                findMatchBorder: '#F1C40F66',
                findRangeHighlightBackground: '#F1C40F22',
                findRangeHighlightBorder: '#F1C40F44',
                inactiveSelectionBackground: '#3498DB22',
                inactiveSelectionForeground: '#ECF0F1',
                minimapBackground: '#252526',
                minimapSelectionHighlight: '#3498DB33',
                minimapFindMatchHighlight: '#F1C40F33',
                minimapErrorHighlight: '#E74C3C33',
                minimapWarningHighlight: '#F39C1233',
                minimapGutterAddedBackground: '#2ECC7133',
                minimapGutterModifiedBackground: '#F1C40F33',
                minimapGutterDeletedBackground: '#E74C3C33',
                editorGroupHeaderBackground: '#252526',
                editorGroupHeaderForeground: '#ECF0F1',
                editorGroupHeaderTabsBackground: '#252526',
                editorGroupHeaderTabsForeground: '#ECF0F1',
                editorGroupHeaderTabsBorder: '#3C3C3C',
                editorGroupHeaderTabsActiveBackground: '#1E1E1E',
                editorGroupHeaderTabsActiveForeground: '#ECF0F1',
                editorGroupHeaderTabsActiveBorder: '#3498DB',
                editorGroupHeaderTabsInactiveBackground: '#252526',
                editorGroupHeaderTabsInactiveForeground: '#95A5A6',
                editorGroupHeaderTabsInactiveBorder: '#3C3C3C',
                editorGroupHeaderTabsHoverBackground: '#1E1E1E',
                editorGroupHeaderTabsHoverForeground: '#ECF0F1',
                editorGroupHeaderTabsHoverBorder: '#3498DB',
                editorGroupHeaderTabsUnfocusedBackground: '#252526',
                editorGroupHeaderTabsUnfocusedForeground: '#95A5A6',
                editorGroupHeaderTabsUnfocusedBorder: '#3C3C3C',
                editorGroupHeaderTabsUnfocusedActiveBackground: '#1E1E1E',
                editorGroupHeaderTabsUnfocusedActiveForeground: '#ECF0F1',
                editorGroupHeaderTabsUnfocusedActiveBorder: '#3498DB',
                editorGroupHeaderTabsUnfocusedInactiveBackground: '#252526',
                editorGroupHeaderTabsUnfocusedInactiveForeground: '#95A5A6',
                editorGroupHeaderTabsUnfocusedInactiveBorder: '#3C3C3C',
                editorGroupHeaderTabsUnfocusedHoverBackground: '#1E1E1E',
                editorGroupHeaderTabsUnfocusedHoverForeground: '#ECF0F1',
                editorGroupHeaderTabsUnfocusedHoverBorder: '#3498DB'
            },
            tokenColors: [
                {
                    name: 'Keywords',
                    scope: ['keyword', 'storage', 'type'],
                    settings: {
                        foreground: '#3498DB',
                        fontStyle: 'bold'
                    }
                },
                {
                    name: 'Functions',
                    scope: ['entity.name.function', 'support.function'],
                    settings: {
                        foreground: '#2ECC71',
                        fontStyle: 'bold'
                    }
                },
                {
                    name: 'Strings',
                    scope: ['string', 'string.template'],
                    settings: {
                        foreground: '#E67E22'
                    }
                },
                {
                    name: 'Comments',
                    scope: ['comment', 'punctuation.definition.comment'],
                    settings: {
                        foreground: '#95A5A6',
                        fontStyle: 'italic'
                    }
                },
                {
                    name: 'Variables',
                    scope: ['variable', 'variable.other'],
                    settings: {
                        foreground: '#ECF0F1'
                    }
                },
                {
                    name: 'Numbers',
                    scope: ['constant.numeric'],
                    settings: {
                        foreground: '#9B59B6'
                    }
                }
            ]
        },
        {
            id: 'tdah-high-contrast',
            name: 'TDAH High Contrast',
            description: 'Tema de alto contraste otimizado para desenvolvedores com TDAH',
            type: 'high-contrast',
            colors: {
                editorBackground: '#000000',
                editorForeground: '#FFFFFF',
                activityBarBackground: '#000000',
                activityBarForeground: '#FFFFFF',
                statusBarBackground: '#000000',
                statusBarForeground: '#FFFFFF',
                titleBarBackground: '#000000',
                titleBarForeground: '#FFFFFF',
                sideBarBackground: '#000000',
                sideBarForeground: '#FFFFFF',
                focusBorder: '#00FF00',
                selectionBackground: '#00FF0033',
                selectionForeground: '#FFFFFF',
                lineHighlightBackground: '#1A1A1A',
                lineHighlightBorder: '#00FF00',
                cursorColor: '#00FF00',
                wordHighlightBackground: '#00FF0022',
                wordHighlightBorder: '#00FF0044',
                findMatchBackground: '#FFFF0033',
                findMatchBorder: '#FFFF0066',
                findRangeHighlightBackground: '#FFFF0022',
                findRangeHighlightBorder: '#FFFF0044',
                inactiveSelectionBackground: '#00FF0022',
                inactiveSelectionForeground: '#FFFFFF',
                minimapBackground: '#000000',
                minimapSelectionHighlight: '#00FF0033',
                minimapFindMatchHighlight: '#FFFF0033',
                minimapErrorHighlight: '#FF000033',
                minimapWarningHighlight: '#FFFF0033',
                minimapGutterAddedBackground: '#00FF0033',
                minimapGutterModifiedBackground: '#FFFF0033',
                minimapGutterDeletedBackground: '#FF000033',
                editorGroupHeaderBackground: '#000000',
                editorGroupHeaderForeground: '#FFFFFF',
                editorGroupHeaderTabsBackground: '#000000',
                editorGroupHeaderTabsForeground: '#FFFFFF',
                editorGroupHeaderTabsBorder: '#00FF00',
                editorGroupHeaderTabsActiveBackground: '#1A1A1A',
                editorGroupHeaderTabsActiveForeground: '#FFFFFF',
                editorGroupHeaderTabsActiveBorder: '#00FF00',
                editorGroupHeaderTabsInactiveBackground: '#000000',
                editorGroupHeaderTabsInactiveForeground: '#FFFFFF',
                editorGroupHeaderTabsInactiveBorder: '#00FF00',
                editorGroupHeaderTabsHoverBackground: '#1A1A1A',
                editorGroupHeaderTabsHoverForeground: '#FFFFFF',
                editorGroupHeaderTabsHoverBorder: '#00FF00',
                editorGroupHeaderTabsUnfocusedBackground: '#000000',
                editorGroupHeaderTabsUnfocusedForeground: '#FFFFFF',
                editorGroupHeaderTabsUnfocusedBorder: '#00FF00',
                editorGroupHeaderTabsUnfocusedActiveBackground: '#1A1A1A',
                editorGroupHeaderTabsUnfocusedActiveForeground: '#FFFFFF',
                editorGroupHeaderTabsUnfocusedActiveBorder: '#00FF00',
                editorGroupHeaderTabsUnfocusedInactiveBackground: '#000000',
                editorGroupHeaderTabsUnfocusedInactiveForeground: '#FFFFFF',
                editorGroupHeaderTabsUnfocusedInactiveBorder: '#00FF00',
                editorGroupHeaderTabsUnfocusedHoverBackground: '#1A1A1A',
                editorGroupHeaderTabsUnfocusedHoverForeground: '#FFFFFF',
                editorGroupHeaderTabsUnfocusedHoverBorder: '#00FF00'
            },
            tokenColors: [
                {
                    name: 'Keywords',
                    scope: ['keyword', 'storage', 'type'],
                    settings: {
                        foreground: '#00FF00',
                        fontStyle: 'bold'
                    }
                },
                {
                    name: 'Functions',
                    scope: ['entity.name.function', 'support.function'],
                    settings: {
                        foreground: '#00FFFF',
                        fontStyle: 'bold'
                    }
                },
                {
                    name: 'Strings',
                    scope: ['string', 'string.template'],
                    settings: {
                        foreground: '#FFFF00'
                    }
                },
                {
                    name: 'Comments',
                    scope: ['comment', 'punctuation.definition.comment'],
                    settings: {
                        foreground: '#808080',
                        fontStyle: 'italic'
                    }
                },
                {
                    name: 'Variables',
                    scope: ['variable', 'variable.other'],
                    settings: {
                        foreground: '#FFFFFF'
                    }
                },
                {
                    name: 'Numbers',
                    scope: ['constant.numeric'],
                    settings: {
                        foreground: '#FF00FF'
                    }
                }
            ]
        }
    ];

    private constructor() {
        this.config = vscode.workspace.getConfiguration('tdahDevHelper');
    }

    public static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    public async initialize(): Promise<void> {
        // Registrar comando para mudar tema
        this.disposables.push(
            vscode.commands.registerCommand(
                'tdah-dev-helper.changeTheme',
                this.showThemePicker.bind(this)
            )
        );

        // Carregar tema atual
        await this.loadCurrentTheme();
    }

    private async loadCurrentTheme(): Promise<void> {
        const themeId = this.config.get<string>('theme');
        if (themeId) {
            const theme = this.themes.find(t => t.id === themeId);
            if (theme) {
                await this.applyTheme(theme);
            }
        }
    }

    public async showThemePicker(): Promise<void> {
        const selected = await vscode.window.showQuickPick(
            this.themes.map(theme => ({
                label: theme.name,
                description: theme.description,
                theme
            })),
            {
                placeHolder: 'Selecione um tema otimizado para TDAH'
            }
        );

        if (selected) {
            await this.applyTheme(selected.theme);
        }
    }

    private async applyTheme(theme: ThemeConfig): Promise<void> {
        try {
            // Atualizar configuração
            await this.config.update('theme', theme.id, true);

            // Aplicar tema
            await vscode.workspace.getConfiguration().update(
                'workbench.colorTheme',
                theme.id,
                true
            );

            // Salvar tema atual
            this.currentTheme = theme;

            // Notificar usuário
            vscode.window.showInformationMessage(
                `Tema "${theme.name}" aplicado com sucesso!`
            );
        } catch (error) {
            console.error('Erro ao aplicar tema:', error);
            vscode.window.showErrorMessage('Erro ao aplicar tema');
        }
    }

    public getCurrentTheme(): ThemeConfig | null {
        return this.currentTheme;
    }

    public getAvailableThemes(): ThemeConfig[] {
        return [...this.themes];
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
} 