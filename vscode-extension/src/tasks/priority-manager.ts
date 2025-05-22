import { Task, TaskPriority, PriorityCriteria } from './types';

export class PriorityManager {
    private static instance: PriorityManager;

    private constructor() {}

    public static getInstance(): PriorityManager {
        if (!PriorityManager.instance) {
            PriorityManager.instance = new PriorityManager();
        }
        return PriorityManager.instance;
    }

    /**
     * Calcula a prioridade de uma tarefa baseado em seus critérios
     */
    public calculatePriority(criteria: PriorityCriteria): TaskPriority {
        // Garantir que o objeto tenha todas as propriedades necessárias
        const fullCriteria: PriorityCriteria = {
            complexity: criteria.complexity,
            impact: criteria.impact,
            estimatedTime: criteria.estimatedTime,
            deadline: criteria.deadline,
            dependencies: criteria.dependencies || []
        };

        let score = 0;

        // Pontuação baseada na complexidade (1-5)
        score += fullCriteria.complexity * 1;

        // Pontuação baseada no impacto (1-5)
        score += fullCriteria.impact * 1.5;

        // Pontuação baseada no tempo estimado
        // Tarefas mais longas têm prioridade menor
        const timeScore = Math.max(0, 2 - Math.floor(fullCriteria.estimatedTime / 120));
        score += timeScore;

        // Pontuação baseada em dependências
        score += Math.min(fullCriteria.dependencies.length, 3);

        // Pontuação baseada no prazo
        if (fullCriteria.deadline) {
            const now = new Date();
            const daysUntilDeadline = Math.ceil((fullCriteria.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDeadline <= 0) {
                score += 10; // Tarefa vencida
            } else if (daysUntilDeadline <= 1) {
                score += 5; // Prazo de 1 dia
            } else if (daysUntilDeadline <= 3) {
                score += 3; // Prazo de 3 dias
            } else if (daysUntilDeadline <= 7) {
                score += 1; // Prazo de 1 semana
            } else if (daysUntilDeadline <= 14) {
                score += 0.5; // Prazo de 2 semanas
            }
        }

        // Converter pontuação em prioridade
        if (score >= 13) return TaskPriority.URGENT;
        if (score >= 10) return TaskPriority.HIGH;
        if (score >= 7) return TaskPriority.MEDIUM;
        return TaskPriority.LOW;
    }

    /**
     * Atualiza a prioridade de uma tarefa baseado em seus critérios atuais
     */
    public updateTaskPriority(task: Task): Task {
        const newPriority = this.calculatePriority(task.priorityCriteria);
        if (newPriority !== task.priority) {
            task.priority = newPriority;
            task.updatedAt = new Date();
        }
        return task;
    }

    /**
     * Ordena uma lista de tarefas por prioridade
     */
    public sortTasksByPriority(tasks: Task[]): Task[] {
        const priorityOrder = {
            [TaskPriority.URGENT]: 0,
            [TaskPriority.HIGH]: 1,
            [TaskPriority.MEDIUM]: 2,
            [TaskPriority.LOW]: 3
        };

        return [...tasks].sort((a, b) => {
            // Primeiro ordena por prioridade
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;

            // Se a prioridade for igual, ordena por prazo
            if (a.priorityCriteria.deadline && b.priorityCriteria.deadline) {
                return a.priorityCriteria.deadline.getTime() - b.priorityCriteria.deadline.getTime();
            }
            if (a.priorityCriteria.deadline) return -1;
            if (b.priorityCriteria.deadline) return 1;

            // Se não houver prazo, ordena por impacto
            return b.priorityCriteria.impact - a.priorityCriteria.impact;
        });
    }

    /**
     * Sugere uma prioridade para uma nova tarefa baseado em critérios básicos
     */
    public suggestPriorityCriteria(
        estimatedTime: number,
        complexity: number = 3,
        impact: number = 3,
        deadline?: Date
    ): PriorityCriteria {
        return {
            complexity: Math.min(Math.max(complexity, 1), 5),
            impact: Math.min(Math.max(impact, 1), 5),
            estimatedTime: Math.max(estimatedTime, 0),
            deadline,
            dependencies: []
        };
    }
} 