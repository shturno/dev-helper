import * as vscode from 'vscode';
import { ApiClient } from '../api/client';
import { HyperfocusManager } from '../hyperfocus/manager';

export class ContextDetector {
    private apiClient: ApiClient;
    private config: vscode.WorkspaceConfiguration;
    private disposables: vscode.Disposable[] = [];

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
        this.config = vscode.workspace.getConfiguration('tdahDevHelper');
    }

    public initialize(): void {
        // Monitorar abertura de documentos
        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument(this.analyzeDocument.bind(this))
        );

        // Monitorar mudança de foco em editores
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                if (editor) {
                    this.analyzeDocument(editor.document);
                }
            })
        );

        // Verificar periodicamente o horário
        setInterval(this.checkProductivityHours.bind(this), 5 * 60 * 1000); // A cada 5 minutos
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }

    private async analyzeDocument(document: vscode.TextDocument): Promise<void> {
        // Ignorar documentos não relevantes
        if (document.uri.scheme !== 'file' || !this.isCodeFile(document)) {
            return;
        }

        // Verificar se o modo hiperfoco automático está ativado
        if (!this.config.get('hyperfocus.enabled', true)) {
            return;
        }

        // Analisar complexidade
        const complexity = this.calculateComplexity(document);
        const threshold = this.config.get('hyperfocus.fileComplexityThreshold', 500);

        // Verificar se está em horário de pico
        const isPeakTime = await this.checkProductivityHours();

        // Decidir se deve ativar o modo hiperfoco
        if (complexity > threshold || isPeakTime) {
            HyperfocusManager.getInstance().activateHyperfocus({
                reason: complexity > threshold ? 'complex_file' : 'peak_time',
                complexity,
                fileName: document.fileName
            });
        }
    }

    private calculateComplexity(document: vscode.TextDocument): number {
        // Implementação básica: contar linhas e analisar complexidade ciclomática
        const lineCount = document.lineCount;
        let complexity = lineCount;

        // Análise adicional: verificar complexidade ciclomática
        const text = document.getText();
        
        // Contar condicionais (if, else, switch, case)
        const conditionals = (text.match(/\b(if|else|switch|case)\b/g) || []).length;
        
        // Contar loops (for, while, do)
        const loops = (text.match(/\b(for|while|do)\b/g) || []).length;
        
        // Contar funções/métodos
        const functions = (text.match(/\b(function|=>)\b/g) || []).length;
        
        // Calcular complexidade ciclomática básica
        complexity += conditionals + loops + (functions * 2);

        return complexity;
    }

    private async checkProductivityHours(): Promise<boolean> {
        try {
            const productivityData = await this.apiClient.getUserProductivityData();
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;

            // Verificar se o horário atual está dentro de um período de pico
            return productivityData.peakHours.some(period => {
                const [startHour, startMinute] = period.start.split(':').map(Number);
                const [endHour, endMinute] = period.end.split(':').map(Number);
                
                const startTime = startHour * 60 + startMinute;
                const endTime = endHour * 60 + endMinute;
                
                return currentTime >= startTime && currentTime <= endTime;
            });
        } catch (error) {
            console.error('Erro ao verificar horários produtivos:', error);
            return false;
        }
    }

    private isCodeFile(document: vscode.TextDocument): boolean {
        // Lista de extensões de arquivo de código
        const codeExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.php',
            '.c', '.cpp', '.cs', '.go', '.rb', '.swift', '.kt'
        ];
        const fileName = document.fileName.toLowerCase();
        return codeExtensions.some(ext => fileName.endsWith(ext));
    }
} 