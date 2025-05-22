import { Task, TaskPriority, PriorityCriteria, TaskStatus } from './types';

interface TaskHistory {
    taskId: number;
    title: string;
    priority: TaskPriority;
    criteria: PriorityCriteria;
    completedAt: Date;
    actualTimeSpent: number;
}

interface PrioritySuggestion {
    suggestedPriority: TaskPriority;
    confidence: number;
    reasons: string[];
}

export class PrioritySuggestionManager {
    private static instance: PrioritySuggestionManager;
    private taskHistory: TaskHistory[] = [];
    private readonly MAX_HISTORY_SIZE = 100;
    private readonly CONFIDENCE_THRESHOLD = 0.7;

    private constructor() {}

    public static getInstance(): PrioritySuggestionManager {
        if (!PrioritySuggestionManager.instance) {
            PrioritySuggestionManager.instance = new PrioritySuggestionManager();
        }
        return PrioritySuggestionManager.instance;
    }

    public addToHistory(task: Task, actualTimeSpent: number): void {
        if (task.status === TaskStatus.COMPLETED && task.completedAt) {
            const historyEntry: TaskHistory = {
                taskId: task.id,
                title: task.title,
                priority: task.priority,
                criteria: task.priorityCriteria,
                completedAt: task.completedAt,
                actualTimeSpent
            };

            this.taskHistory.unshift(historyEntry);
            
            // Manter apenas as últimas MAX_HISTORY_SIZE entradas
            if (this.taskHistory.length > this.MAX_HISTORY_SIZE) {
                this.taskHistory.pop();
            }
        }
    }

    public getPrioritySuggestion(criteria: PriorityCriteria): PrioritySuggestion {
        const fullCriteria: PriorityCriteria = {
            complexity: criteria.complexity,
            impact: criteria.impact,
            estimatedTime: criteria.estimatedTime,
            deadline: criteria.deadline,
            dependencies: criteria.dependencies || []
        };
        const similarTasks = this.findSimilarTasks(fullCriteria);
        const suggestion = this.analyzeSimilarTasks(similarTasks, fullCriteria);
        return suggestion;
    }

    private findSimilarTasks(criteria: PriorityCriteria): TaskHistory[] {
        return this.taskHistory.filter(history => {
            const complexityDiff = Math.abs(history.criteria.complexity - criteria.complexity);
            const impactDiff = Math.abs(history.criteria.impact - criteria.impact);
            const timeDiff = Math.abs(history.criteria.estimatedTime - criteria.estimatedTime);

            // Considerar tarefas similares se as diferenças estiverem dentro de um limite
            return complexityDiff <= 1 && impactDiff <= 1 && timeDiff <= 30;
        });
    }

    private analyzeSimilarTasks(similarTasks: TaskHistory[], currentCriteria: PriorityCriteria): PrioritySuggestion {
        if (similarTasks.length === 0) {
            return {
                suggestedPriority: TaskPriority.MEDIUM,
                confidence: 0.5,
                reasons: ['Sem histórico suficiente para sugestão precisa']
            };
        }

        // Agrupar tarefas por prioridade
        const priorityGroups = new Map<TaskPriority, TaskHistory[]>();
        similarTasks.forEach(task => {
            const group = priorityGroups.get(task.priority) || [];
            group.push(task);
            priorityGroups.set(task.priority, group);
        });

        // Encontrar a prioridade mais comum
        let mostCommonPriority = TaskPriority.MEDIUM;
        let maxCount = 0;
        let totalConfidence = 0;
        const reasons: string[] = [];

        priorityGroups.forEach((tasks, priority) => {
            if (tasks.length > maxCount) {
                maxCount = tasks.length;
                mostCommonPriority = priority;
            }

            // Calcular confiança baseada na similaridade
            const avgComplexity = tasks.reduce((sum, t) => sum + t.criteria.complexity, 0) / tasks.length;
            const avgImpact = tasks.reduce((sum, t) => sum + t.criteria.impact, 0) / tasks.length;
            const avgTime = tasks.reduce((sum, t) => sum + t.criteria.estimatedTime, 0) / tasks.length;

            const complexityMatch = 1 - Math.abs(avgComplexity - currentCriteria.complexity) / 5;
            const impactMatch = 1 - Math.abs(avgImpact - currentCriteria.impact) / 5;
            const timeMatch = 1 - Math.abs(avgTime - currentCriteria.estimatedTime) / (currentCriteria.estimatedTime * 2);

            const confidence = (complexityMatch + impactMatch + timeMatch) / 3;
            totalConfidence += confidence;

            // Adicionar razões para a sugestão
            if (confidence > this.CONFIDENCE_THRESHOLD) {
                reasons.push(
                    `Tarefas similares com complexidade ${avgComplexity.toFixed(1)}/5 ` +
                    `e impacto ${avgImpact.toFixed(1)}/5 foram marcadas como ${priority}`
                );
            }
        });

        // Adicionar razões específicas baseadas nos critérios atuais
        if (currentCriteria.complexity >= 4) {
            reasons.push('Alta complexidade sugere prioridade elevada');
        }
        if (currentCriteria.impact >= 4) {
            reasons.push('Alto impacto sugere prioridade elevada');
        }
        if (currentCriteria.deadline && this.isDeadlineUrgent(currentCriteria.deadline)) {
            reasons.push('Prazo próximo sugere prioridade urgente');
        }

        return {
            suggestedPriority: mostCommonPriority,
            confidence: totalConfidence / priorityGroups.size,
            reasons: reasons.length > 0 ? reasons : ['Sugestão baseada em padrões históricos']
        };
    }

    private isDeadlineUrgent(deadline: Date): boolean {
        const now = new Date();
        const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilDeadline <= 2; // Considerar urgente se faltar 2 dias ou menos
    }

    public getUrgentTasks(tasks: Task[]): Task[] {
        const now = new Date();
        return tasks.filter(task => {
            if (task.priority === TaskPriority.URGENT) return true;
            
            if (task.priorityCriteria.deadline) {
                const daysUntilDeadline = (task.priorityCriteria.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                return daysUntilDeadline <= 2 && task.priorityCriteria.impact >= 4;
            }
            
            return false;
        });
    }
} 