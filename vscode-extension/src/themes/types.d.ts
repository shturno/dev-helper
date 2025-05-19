declare module 'themes/manager' {
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
        private constructor();
        public static getInstance(): ThemeManager;
        public initialize(): Promise<void>;
        public getCurrentTheme(): ThemeConfig | null;
        public getAvailableThemes(): ThemeConfig[];
        public showThemePicker(): Promise<void>;
        public dispose(): void;
    }
} 