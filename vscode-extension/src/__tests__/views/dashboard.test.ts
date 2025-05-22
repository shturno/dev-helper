import * as vscode from 'vscode';
import { DashboardView } from '../../views/dashboard';
import { TaskTracker } from '../../tasks/tracker';
import { HyperfocusManager } from '../../hyperfocus/manager';
import { AnalysisManager } from '../../analysis/manager';

// Mock do vscode
jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showInputBox: jest.fn(),
        showQuickPick: jest.fn(),
        createStatusBarItem: jest.fn(() => ({
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
            text: '',
            tooltip: '',
            command: ''
        })),
        createWebviewPanel: jest.fn(() => ({
            webview: {
                html: '',
                postMessage: jest.fn(),
                onDidReceiveMessage: jest.fn()
            },
            reveal: jest.fn(),
            onDidDispose: jest.fn(),
            dispose: jest.fn()
        }))
    },
    commands: {
        registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
        executeCommand: jest.fn()
    },
    ViewColumn: {
        One: 1
    }
}));

// Mock dos componentes
jest.mock('../../tasks/tracker');
jest.mock('../../hyperfocus/manager');
jest.mock('../../analysis/manager');

describe('DashboardView', () => {
    let dashboardView: DashboardView;
    let mockContext: vscode.ExtensionContext;
    let mockTaskTracker: jest.Mocked<TaskTracker>;
    let mockHyperfocusManager: jest.Mocked<HyperfocusManager>;
    let mockAnalysisManager: jest.Mocked<AnalysisManager>;
    let mockWebviewView: vscode.WebviewView;

    beforeEach(() => {
        // Reset dos mocks
        jest.clearAllMocks();

        // Mock do contexto
        mockContext = {
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            subscriptions: []
        } as unknown as vscode.ExtensionContext;

        // Mock dos componentes
        mockTaskTracker = {
            getTasks: jest.fn(),
            createTask: jest.fn(),
            decomposeCurrentTask: jest.fn()
        } as unknown as jest.Mocked<TaskTracker>;

        mockHyperfocusManager = {
            isActive: false,
            startHyperfocus: jest.fn(),
            stopHyperfocus: jest.fn(),
            getStats: jest.fn().mockReturnValue({
                todayMinutes: 60,
                totalMinutes: 120,
                sessions: 2,
                streak: 3
            })
        } as unknown as jest.Mocked<HyperfocusManager>;

        mockAnalysisManager = {
            getStats: jest.fn().mockReturnValue({
                streak: 3,
                mostProductiveHour: '10:00',
                bestDay: 'Segunda',
                dailyStats: [],
                monthlyStats: [],
                insights: []
            })
        } as unknown as jest.Mocked<AnalysisManager>;

        // Mock do WebviewView
        mockWebviewView = {
            webview: {
                html: '',
                postMessage: jest.fn(),
                onDidReceiveMessage: jest.fn()
            },
            onDidDispose: jest.fn()
        } as unknown as vscode.WebviewView;

        // Criar instância do DashboardView
        dashboardView = new DashboardView(
            mockTaskTracker,
            mockHyperfocusManager,
            mockAnalysisManager,
            mockContext
        );
    });

    describe('resolveWebviewView', () => {
        it('should initialize webview with content', () => {
            dashboardView.resolveWebviewView(
                mockWebviewView,
                {} as vscode.WebviewViewResolveContext,
                {} as vscode.CancellationToken
            );

            expect(mockWebviewView.webview.html).toContain('<!DOCTYPE html>');
            expect(mockWebviewView.webview.html).toContain('Dashboard - Dev Helper');
        });

        it('should register message handler', () => {
            dashboardView.resolveWebviewView(
                mockWebviewView,
                {} as vscode.WebviewViewResolveContext,
                {} as vscode.CancellationToken
            );

            expect(mockWebviewView.webview.onDidReceiveMessage).toHaveBeenCalled();
        });

        it('should update dashboard periodically', () => {
            jest.useFakeTimers();

            dashboardView.resolveWebviewView(
                mockWebviewView,
                {} as vscode.WebviewViewResolveContext,
                {} as vscode.CancellationToken
            );

            jest.advanceTimersByTime(5000);
            expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'update',
                    stats: expect.any(Object)
                })
            );

            jest.useRealTimers();
        });
    });

    describe('update', () => {
        it('should send updated stats to webview', () => {
            dashboardView.resolveWebviewView(
                mockWebviewView,
                {} as vscode.WebviewViewResolveContext,
                {} as vscode.CancellationToken
            );

            dashboardView.update();

            expect(mockWebviewView.webview.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'update',
                    stats: expect.objectContaining({
                        focusTime: expect.any(Number),
                        streak: expect.any(Number),
                        tasksCompleted: expect.any(Number),
                        completionRate: expect.any(Number)
                    })
                })
            );
        });

        it('should not update if webview is not initialized', () => {
            dashboardView.update();
            expect(mockWebviewView.webview.postMessage).not.toHaveBeenCalled();
        });
    });

    describe('tag management', () => {
        it('should show tag management quick pick', () => {
            (dashboardView as any).showTagManagement();
            expect(vscode.window.createQuickPick).toHaveBeenCalled();
        });

        it('should handle tag creation', async () => {
            const quickPick = {
                items: [],
                onDidChangeSelection: jest.fn(),
                show: jest.fn()
            };
            (vscode.window.createQuickPick as jest.Mock).mockReturnValue(quickPick);

            (dashboardView as any).showTagManagement();
            const selectionHandler = quickPick.onDidChangeSelection.mock.calls[0][0];
            await selectionHandler([{ label: '$(plus) Criar nova tag' }]);

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('dev-helper.createTag');
        });

        it('should handle tag editing', async () => {
            const quickPick = {
                items: [],
                onDidChangeSelection: jest.fn(),
                show: jest.fn()
            };
            (vscode.window.createQuickPick as jest.Mock).mockReturnValue(quickPick);
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: 'Tag1',
                value: { id: 1, name: 'Tag1' }
            });

            (dashboardView as any).showTagManagement();
            const selectionHandler = quickPick.onDidChangeSelection.mock.calls[0][0];
            await selectionHandler([{ label: '$(pencil) Editar tag' }]);

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'dev-helper.editTag',
                expect.objectContaining({ id: 1, name: 'Tag1' })
            );
        });
    });

    describe('category management', () => {
        it('should show category management quick pick', () => {
            (dashboardView as any).showCategoryManagement();
            expect(vscode.window.createQuickPick).toHaveBeenCalled();
        });

        it('should handle category creation', async () => {
            const quickPick = {
                items: [],
                onDidChangeSelection: jest.fn(),
                show: jest.fn()
            };
            (vscode.window.createQuickPick as jest.Mock).mockReturnValue(quickPick);

            (dashboardView as any).showCategoryManagement();
            const selectionHandler = quickPick.onDidChangeSelection.mock.calls[0][0];
            await selectionHandler([{ label: '$(plus) Criar nova categoria' }]);

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith('dev-helper.createCategory');
        });

        it('should handle category editing', async () => {
            const quickPick = {
                items: [],
                onDidChangeSelection: jest.fn(),
                show: jest.fn()
            };
            (vscode.window.createQuickPick as jest.Mock).mockReturnValue(quickPick);
            (vscode.window.showQuickPick as jest.Mock).mockResolvedValue({
                label: 'Category1',
                value: { id: 1, name: 'Category1' }
            });

            (dashboardView as any).showCategoryManagement();
            const selectionHandler = quickPick.onDidChangeSelection.mock.calls[0][0];
            await selectionHandler([{ label: '$(pencil) Editar categoria' }]);

            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'dev-helper.editCategory',
                expect.objectContaining({ id: 1, name: 'Category1' })
            );
        });
    });

    describe('dispose', () => {
        it('should dispose all registered commands', () => {
            const mockDisposable = { dispose: jest.fn() };
            (vscode.commands.registerCommand as jest.Mock).mockReturnValue(mockDisposable);

            dashboardView.dispose();
            expect(mockDisposable.dispose).toHaveBeenCalled();
        });

        it('should clear webview reference', () => {
            dashboardView.resolveWebviewView(
                mockWebviewView,
                {} as vscode.WebviewViewResolveContext,
                {} as vscode.CancellationToken
            );

            dashboardView.dispose();
            dashboardView.update();
            expect(mockWebviewView.webview.postMessage).not.toHaveBeenCalled();
        });
    });

    describe('message handling', () => {
        it('should handle startFocus message', async () => {
            dashboardView.resolveWebviewView(
                mockWebviewView,
                {} as vscode.WebviewViewResolveContext,
                {} as vscode.CancellationToken
            );

            const messageHandler = (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mock.calls[0][0];
            await messageHandler({ command: 'startFocus' });

            expect(mockHyperfocusManager.startHyperfocus).toHaveBeenCalled();
        });

        it('should handle createTask message', async () => {
            dashboardView.resolveWebviewView(
                mockWebviewView,
                {} as vscode.WebviewViewResolveContext,
                {} as vscode.CancellationToken
            );

            const messageHandler = (mockWebviewView.webview.onDidReceiveMessage as jest.Mock).mock.calls[0][0];
            await messageHandler({ command: 'createTask' });

            expect(mockTaskTracker.createTask).toHaveBeenCalled();
        });
    });
}); 