import * as vscode from 'vscode';
import { Tag, Category } from './types';
import { Logger } from '../utils/logger';

interface CategoryQuickPickItem extends vscode.QuickPickItem {
    value: Category;
}

export class TagManager {
    private static instance: TagManager;
    private tags: Tag[] = [];
    private categories: Category[] = [];
    private disposables: vscode.Disposable[] = [];
    private logger: Logger;

    private constructor(private context: vscode.ExtensionContext) {
        this.logger = Logger.getInstance();
        this.loadTags();
        this.loadCategories();
        this.initialize();
    }

    public static getInstance(context?: vscode.ExtensionContext): TagManager {
        if (!TagManager.instance) {
            if (!context) {
                throw new Error('Context is required for first initialization');
            }
            TagManager.instance = new TagManager(context);
        }
        return TagManager.instance;
    }

    private initialize(): void {
        // Registrar comandos
        this.disposables.push(
            vscode.commands.registerCommand('dev-helper.createTag', () => this.createTag()),
            vscode.commands.registerCommand('dev-helper.editTag', (tag: Tag) => this.editTag(tag)),
            vscode.commands.registerCommand('dev-helper.deleteTag', (tag: Tag) => this.deleteTag(tag)),
            vscode.commands.registerCommand('dev-helper.createCategory', () => this.createCategory()),
            vscode.commands.registerCommand('dev-helper.editCategory', (category: Category) => this.editCategory(category)),
            vscode.commands.registerCommand('dev-helper.deleteCategory', (category: Category) => this.deleteCategory(category))
        );
    }

    private async loadTags(): Promise<void> {
        try {
            const savedTags = this.context.globalState.get<Tag[]>('dev-helper-tags');
            if (savedTags) {
                this.tags = savedTags;
            }
        } catch (error) {
            this.logger.error('Erro ao carregar tags:', error as Error);
        }
    }

    private async loadCategories(): Promise<void> {
        try {
            const savedCategories = this.context.globalState.get<Category[]>('dev-helper-categories');
            if (savedCategories) {
                this.categories = savedCategories;
            }
        } catch (error) {
            this.logger.error('Erro ao carregar categorias:', error as Error);
        }
    }

    private async saveTags(): Promise<void> {
        try {
            await this.context.globalState.update('dev-helper-tags', this.tags);
        } catch (error) {
            this.logger.error('Erro ao salvar tags:', error as Error);
            throw error;
        }
    }

    private async saveCategories(): Promise<void> {
        try {
            await this.context.globalState.update('dev-helper-categories', this.categories);
        } catch (error) {
            this.logger.error('Erro ao salvar categorias:', error as Error);
            throw error;
        }
    }

    public async createTag(): Promise<Tag | undefined> {
        try {
            const name = await vscode.window.showInputBox({
                prompt: 'Nome da tag',
                placeHolder: 'Ex: Bug, Feature, Documentação'
            });

            if (!name) return undefined;

            const description = await vscode.window.showInputBox({
                prompt: 'Descrição da tag (opcional)',
                placeHolder: 'Descreva o propósito desta tag'
            });

            const colorOptions = [
                { label: '#FF0000' },
                { label: '#00FF00' },
                { label: '#0000FF' },
                { label: '#FFFF00' },
                { label: '#FF00FF' },
                { label: '#00FFFF' }
            ];
            const colorPick = await vscode.window.showQuickPick(colorOptions, {
                placeHolder: 'Selecione uma cor para a tag'
            });
            const color = colorPick?.label;

            if (!color) return undefined;

            const tag: Tag = {
                id: Date.now().toString(),
                name,
                description,
                color
            };

            this.tags.push(tag);
            await this.saveTags();
            return tag;
        } catch (error) {
            this.logger.error('Erro ao criar tag:', error as Error);
            vscode.window.showErrorMessage('Erro ao criar tag');
            return undefined;
        }
    }

    public async editTag(tag: Tag): Promise<Tag | undefined> {
        try {
            const name = await vscode.window.showInputBox({
                prompt: 'Nome da tag',
                value: tag.name
            });

            if (!name) return undefined;

            const description = await vscode.window.showInputBox({
                prompt: 'Descrição da tag (opcional)',
                value: tag.description
            });

            const colorOptions: vscode.QuickPickItem[] = [
                { label: 'Vermelho', description: '#FF0000' },
                { label: 'Verde', description: '#00FF00' },
                { label: 'Azul', description: '#0000FF' },
                { label: 'Amarelo', description: '#FFFF00' },
                { label: 'Magenta', description: '#FF00FF' },
                { label: 'Ciano', description: '#00FFFF' }
            ];
            const colorPick = await vscode.window.showQuickPick(colorOptions, {
                placeHolder: 'Selecione uma cor para a tag'
            });
            const color = colorPick?.description;

            if (!color) return undefined;

            const updatedTag: Tag = {
                ...tag,
                name,
                description,
                color
            };

            const index = this.tags.findIndex(t => t.id === tag.id);
            if (index !== -1) {
                this.tags[index] = updatedTag;
                await this.saveTags();
                return updatedTag;
            }
            return undefined;
        } catch (error) {
            this.logger.error('Erro ao editar tag:', error as Error);
            vscode.window.showErrorMessage('Erro ao editar tag');
            return undefined;
        }
    }

    public async deleteTag(tag: Tag): Promise<boolean> {
        try {
            const confirm = await vscode.window.showWarningMessage(
                `Tem certeza que deseja excluir a tag "${tag.name}"?`,
                { modal: true },
                'Sim',
                'Não'
            );

            if (confirm !== 'Sim') return false;

            this.tags = this.tags.filter(t => t.id !== tag.id);
            await this.saveTags();
            return true;
        } catch (error) {
            this.logger.error('Erro ao excluir tag:', error as Error);
            vscode.window.showErrorMessage('Erro ao excluir tag');
            return false;
        }
    }

    public async createCategory(): Promise<Category | undefined> {
        try {
            const name = await vscode.window.showInputBox({
                prompt: 'Nome da categoria',
                placeHolder: 'Ex: Frontend, Backend, Testes'
            });

            if (!name) return undefined;

            const description = await vscode.window.showInputBox({
                prompt: 'Descrição da categoria (opcional)',
                placeHolder: 'Descreva o propósito desta categoria'
            });

            const colorOptions: vscode.QuickPickItem[] = [
                { label: 'Vermelho', description: '#FF0000' },
                { label: 'Verde', description: '#00FF00' },
                { label: 'Azul', description: '#0000FF' },
                { label: 'Amarelo', description: '#FFFF00' },
                { label: 'Magenta', description: '#FF00FF' },
                { label: 'Ciano', description: '#00FFFF' }
            ];
            const colorPick = await vscode.window.showQuickPick(colorOptions, {
                placeHolder: 'Selecione uma cor para a categoria'
            });
            const color = colorPick?.description;

            if (!color) return undefined;

            const iconOptions: vscode.QuickPickItem[] = [
                { label: '$(code)', description: 'Código' },
                { label: '$(bug)', description: 'Bug' },
                { label: '$(book)', description: 'Documentação' },
                { label: '$(tools)', description: 'Ferramentas' },
                { label: '$(rocket)', description: 'Lançamento' },
                { label: '$(lightbulb)', description: 'Ideia' }
            ];
            const iconPick = await vscode.window.showQuickPick(iconOptions, {
                placeHolder: 'Selecione um ícone para a categoria'
            });
            const icon = iconPick?.label;

            const parentCategoryOptions: CategoryQuickPickItem[] = this.categories.map(c => ({
                label: c.name,
                description: c.description || '',
                value: c
            }));
            const parentCategoryPick = await vscode.window.showQuickPick(parentCategoryOptions, {
                placeHolder: 'Selecione uma categoria pai (opcional)'
            });
            const parentCategory = parentCategoryPick?.value;

            const category: Category = {
                id: Date.now().toString(),
                name,
                description,
                color,
                icon: icon || '$(folder)',
                parentId: parentCategory?.id
            };

            this.categories.push(category);
            await this.saveCategories();
            return category;
        } catch (error) {
            this.logger.error('Erro ao criar categoria:', error as Error);
            vscode.window.showErrorMessage('Erro ao criar categoria');
            return undefined;
        }
    }

    public async editCategory(category: Category): Promise<Category | undefined> {
        try {
            const name = await vscode.window.showInputBox({
                prompt: 'Nome da categoria',
                value: category.name
            });

            if (!name) return undefined;

            const description = await vscode.window.showInputBox({
                prompt: 'Descrição da categoria (opcional)',
                value: category.description
            });

            const colorOptions: vscode.QuickPickItem[] = [
                { label: 'Vermelho', description: '#FF0000' },
                { label: 'Verde', description: '#00FF00' },
                { label: 'Azul', description: '#0000FF' },
                { label: 'Amarelo', description: '#FFFF00' },
                { label: 'Magenta', description: '#FF00FF' },
                { label: 'Ciano', description: '#00FFFF' }
            ];
            const colorPick = await vscode.window.showQuickPick(colorOptions, {
                placeHolder: 'Selecione uma cor para a categoria'
            });
            const color = colorPick?.description;

            if (!color) return undefined;

            const iconOptions: vscode.QuickPickItem[] = [
                { label: '$(code)', description: 'Código' },
                { label: '$(bug)', description: 'Bug' },
                { label: '$(book)', description: 'Documentação' },
                { label: '$(tools)', description: 'Ferramentas' },
                { label: '$(rocket)', description: 'Lançamento' },
                { label: '$(lightbulb)', description: 'Ideia' }
            ];
            const iconPick = await vscode.window.showQuickPick(iconOptions, {
                placeHolder: 'Selecione um ícone para a categoria'
            });
            const icon = iconPick?.label;

            const parentCategoryOptions: CategoryQuickPickItem[] = this.categories
                .filter(c => c.id !== category.id)
                .map(c => ({
                    label: c.name,
                    description: c.description || '',
                    value: c
                }));
            const parentCategoryPick = await vscode.window.showQuickPick(parentCategoryOptions, {
                placeHolder: 'Selecione uma categoria pai (opcional)'
            });
            const parentCategory = parentCategoryPick?.value;

            const updatedCategory: Category = {
                ...category,
                name,
                description,
                color,
                icon: icon || category.icon,
                parentId: parentCategory?.id
            };

            const index = this.categories.findIndex(c => c.id === category.id);
            if (index !== -1) {
                this.categories[index] = updatedCategory;
                await this.saveCategories();
                return updatedCategory;
            }
            return undefined;
        } catch (error) {
            this.logger.error('Erro ao editar categoria:', error as Error);
            vscode.window.showErrorMessage('Erro ao editar categoria');
            return undefined;
        }
    }

    public async deleteCategory(category: Category): Promise<boolean> {
        try {
            const confirm = await vscode.window.showWarningMessage(
                `Tem certeza que deseja excluir a categoria "${category.name}"?`,
                { modal: true },
                'Sim',
                'Não'
            );

            if (confirm !== 'Sim') return false;

            // Verificar se existem tarefas usando esta categoria
            const tasks = this.context.globalState.get<any[]>('dev-helper-tasks') || [];
            const tasksUsingCategory = tasks.filter(t => t.category?.id === category.id);
            
            if (tasksUsingCategory.length > 0) {
                const reassign = await vscode.window.showWarningMessage(
                    `Existem ${tasksUsingCategory.length} tarefas usando esta categoria. Deseja reatribuí-las?`,
                    { modal: true },
                    'Sim',
                    'Não'
                );

                if (reassign === 'Sim') {
                    const newCategory = await vscode.window.showQuickPick(
                        this.categories.filter(c => c.id !== category.id).map(c => ({ label: c.name, value: c })),
                        {
                            placeHolder: 'Selecione uma nova categoria'
                        }
                    );

                    if (newCategory) {
                        tasksUsingCategory.forEach(task => {
                            task.category = newCategory.value;
                        });
                        await this.context.globalState.update('dev-helper-tasks', tasks);
                    }
                }
            }

            this.categories = this.categories.filter(c => c.id !== category.id);
            await this.saveCategories();
            return true;
        } catch (error) {
            this.logger.error('Erro ao excluir categoria:', error as Error);
            vscode.window.showErrorMessage('Erro ao excluir categoria');
            return false;
        }
    }

    public async reloadTags(): Promise<void> {
        await this.loadTags();
    }

    public async reloadCategories(): Promise<void> {
        await this.loadCategories();
    }

    public getTags(): Tag[] {
        return [...this.tags];
    }

    public getCategories(): Category[] {
        return [...this.categories];
    }

    public getTagById(id: string): Tag | undefined {
        return this.tags.find(t => t.id === id);
    }

    public getCategoryById(id: string): Category | undefined {
        return this.categories.find(c => c.id === id);
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}