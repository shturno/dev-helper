import * as vscode from 'vscode';
import { TagManager } from '../../tasks/tag-manager';
import { Tag, Category } from '../../tasks/types';

// Mock do vscode
jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showInputBox: jest.fn(),
        showQuickPick: jest.fn()
    }
}));

describe('TagManager', () => {
    let tagManager: TagManager;
    let mockContext: vscode.ExtensionContext;

    beforeEach(() => {
        // Reset dos mocks
        jest.clearAllMocks();
        (TagManager as any).instance = undefined;

        // Mock do contexto
        mockContext = {
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            subscriptions: []
        } as unknown as vscode.ExtensionContext;

        // Estado mutável para simular o globalState
        let tagData = {
            tags: [] as Tag[],
            categories: [] as Category[]
        };

        (mockContext.globalState.get as jest.Mock).mockImplementation((key) => {
            if (key === 'dev-helper-tags') {
                return { ...tagData, tags: [...tagData.tags] };
            }
            if (key === 'dev-helper-categories') {
                return { ...tagData, categories: [...tagData.categories] };
            }
            return null;
        });

        (mockContext.globalState.update as jest.Mock).mockImplementation((key, value) => {
            if (key === 'dev-helper-tags') {
                tagData.tags = [...value.tags];
            }
            if (key === 'dev-helper-categories') {
                tagData.categories = [...value.categories];
            }
            return Promise.resolve();
        });

        tagManager = TagManager.getInstance(mockContext);
    });

    describe('getInstance', () => {
        it('should create a singleton instance', () => {
            const instance1 = TagManager.getInstance(mockContext);
            const instance2 = TagManager.getInstance(mockContext);
            expect(instance1).toBe(instance2);
        });

        it('should throw error if context is not provided on first initialization', () => {
            expect(() => TagManager.getInstance()).toThrow('Context is required to initialize TagManager');
        });
    });

    describe('tag management', () => {
        it('should create a new tag', async () => {
            const tagName = 'Test Tag';
            const tagColor = '#ff0000';
            const tagDescription = 'Test Description';

            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce(tagName)
                .mockResolvedValueOnce(tagColor)
                .mockResolvedValueOnce(tagDescription);

            await tagManager.createTag();

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-tags',
                expect.objectContaining({
                    tags: expect.arrayContaining([
                        expect.objectContaining({
                            name: tagName,
                            color: tagColor,
                            description: tagDescription
                        })
                    ])
                })
            );
        });

        it('should edit an existing tag', async () => {
            const existingTag: Tag = {
                id: '1',
                name: 'Old Tag',
                color: '#000000',
                description: 'Old Description'
            };

            const newName = 'Updated Tag';
            const newColor = '#00ff00';
            const newDescription = 'Updated Description';

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                tags: [existingTag]
            });

            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce(newName)
                .mockResolvedValueOnce(newColor)
                .mockResolvedValueOnce(newDescription);

            await tagManager.editTag(existingTag);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-tags',
                expect.objectContaining({
                    tags: expect.arrayContaining([
                        expect.objectContaining({
                            id: existingTag.id,
                            name: newName,
                            color: newColor,
                            description: newDescription
                        })
                    ])
                })
            );
        });

        it('should delete a tag', async () => {
            const tagToDelete: Tag = {
                id: '1',
                name: 'Test Tag',
                color: '#ff0000',
                description: 'Test Description'
            };

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                tags: [tagToDelete]
            });

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: 'Sim',
                value: true
            });

            await tagManager.deleteTag(tagToDelete);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-tags',
                expect.objectContaining({
                    tags: expect.not.arrayContaining([tagToDelete])
                })
            );
        });

        it('should get all tags', () => {
            const mockTags = [
                { id: '1', name: 'Tag1', color: '#ff0000', description: 'Tag 1' },
                { id: '2', name: 'Tag2', color: '#00ff00', description: 'Tag 2' }
            ];

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                tags: mockTags
            });

            const tags = tagManager.getTags();
            expect(tags).toEqual(mockTags);
        });

        it('should validate tag input', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('');

            await tagManager.createTag();
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
            expect(mockContext.globalState.update).not.toHaveBeenCalled();
        });
    });

    describe('category management', () => {
        it('should create a new category', async () => {
            const categoryName = 'Test Category';
            const categoryColor = '#0000ff';
            const categoryDescription = 'Test Category Description';

            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce(categoryName)
                .mockResolvedValueOnce(categoryColor)
                .mockResolvedValueOnce(categoryDescription);

            await tagManager.createCategory();

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-categories',
                expect.objectContaining({
                    categories: expect.arrayContaining([
                        expect.objectContaining({
                            name: categoryName,
                            color: categoryColor,
                            description: categoryDescription
                        })
                    ])
                })
            );
        });

        it('should edit an existing category', async () => {
            const existingCategory: Category = {
                id: '1',
                name: 'Old Category',
                color: '#000000',
                description: 'Old Description'
            };

            const newName = 'Updated Category';
            const newColor = '#00ff00';
            const newDescription = 'Updated Description';

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                categories: [existingCategory]
            });

            (vscode.window.showInputBox as jest.Mock)
                .mockResolvedValueOnce(newName)
                .mockResolvedValueOnce(newColor)
                .mockResolvedValueOnce(newDescription);

            await tagManager.editCategory(existingCategory);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-categories',
                expect.objectContaining({
                    categories: expect.arrayContaining([
                        expect.objectContaining({
                            id: existingCategory.id,
                            name: newName,
                            color: newColor,
                            description: newDescription
                        })
                    ])
                })
            );
        });

        it('should delete a category', async () => {
            const categoryToDelete: Category = {
                id: '1',
                name: 'Test Category',
                color: '#0000ff',
                description: 'Test Description'
            };

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                categories: [categoryToDelete]
            });

            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: 'Sim',
                value: true
            });

            await tagManager.deleteCategory(categoryToDelete);

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-categories',
                expect.objectContaining({
                    categories: expect.not.arrayContaining([categoryToDelete])
                })
            );
        });

        it('should get all categories', () => {
            const mockCategories = [
                { id: '1', name: 'Category1', color: '#0000ff', description: 'Category 1' },
                { id: '2', name: 'Category2', color: '#ffff00', description: 'Category 2' }
            ];

            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                categories: mockCategories
            });

            const categories = tagManager.getCategories();
            expect(categories).toEqual(mockCategories);
        });

        it('should validate category input', async () => {
            (vscode.window.showInputBox as jest.Mock).mockResolvedValue('');

            await tagManager.createCategory();
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
            expect(mockContext.globalState.update).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should handle errors when creating tag', async () => {
            (vscode.window.showInputBox as jest.Mock).mockRejectedValue(new Error('Input error'));

            await tagManager.createTag();
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });

        it('should handle errors when editing tag', async () => {
            const tag: Tag = {
                id: '1',
                name: 'Test Tag',
                color: '#ff0000',
                description: 'Test Description'
            };
            (vscode.window.showInputBox as jest.Mock).mockRejectedValue(new Error('Input error'));

            await tagManager.editTag(tag);
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });

        it('should handle errors when creating category', async () => {
            (vscode.window.showInputBox as jest.Mock).mockRejectedValue(new Error('Input error'));

            await tagManager.createCategory();
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });

        it('should handle errors when editing category', async () => {
            const category: Category = {
                id: '1',
                name: 'Test Category',
                color: '#0000ff',
                description: 'Test Description'
            };
            (vscode.window.showInputBox as jest.Mock).mockRejectedValue(new Error('Input error'));

            await tagManager.editCategory(category);
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });
    });
}); 