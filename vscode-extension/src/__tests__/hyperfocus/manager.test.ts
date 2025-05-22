import * as vscode from 'vscode';
import { HyperfocusManager } from '../../hyperfocus/manager';
import { NotificationBlocker } from '../../notifications/blocker';

// Mock do vscode
jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        createStatusBarItem: jest.fn(() => ({
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
            text: '',
            tooltip: '',
            command: ''
        }))
    },
    StatusBarAlignment: {
        Right: 2
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn()
        }))
    }
}));

// Mock do NotificationBlocker
jest.mock('../../notifications/blocker', () => ({
    NotificationBlocker: jest.fn().mockImplementation(() => ({
        startBlocking: jest.fn(),
        stopBlocking: jest.fn(),
        dispose: jest.fn()
    }))
}));

describe('HyperfocusManager', () => {
    let hyperfocusManager: HyperfocusManager;
    let mockContext: vscode.ExtensionContext;
    let mockNotificationBlocker: jest.Mocked<NotificationBlocker>;
    let mockStatusBarItem: vscode.StatusBarItem;

    beforeEach(() => {
        // Reset dos mocks
        jest.clearAllMocks();
        (HyperfocusManager as any).instance = undefined;

        // Mock do contexto
        mockContext = {
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            subscriptions: []
        } as unknown as vscode.ExtensionContext;

        // Mock do StatusBarItem
        mockStatusBarItem = {
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
            text: '',
            tooltip: '',
            command: ''
        } as unknown as vscode.StatusBarItem;

        (vscode.window.createStatusBarItem as jest.Mock).mockReturnValue(mockStatusBarItem);

        // Mock do NotificationBlocker
        mockNotificationBlocker = new NotificationBlocker(mockContext) as jest.Mocked<NotificationBlocker>;

        // Estado mutável para simular o globalState
        let hyperfocusData = {
            isActive: false,
            startTime: null,
            totalMinutes: 0,
            sessions: 0,
            streak: 0,
            lastSessionDate: null
        };

        (mockContext.globalState.get as jest.Mock).mockImplementation((key) => {
            if (key === 'dev-helper-hyperfocus') {
                return { ...hyperfocusData };
            }
            return null;
        });

        (mockContext.globalState.update as jest.Mock).mockImplementation((key, value) => {
            if (key === 'dev-helper-hyperfocus') {
                hyperfocusData = { ...value };
            }
            return Promise.resolve();
        });

        // Configurações padrão
        (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
            get: (key: string) => {
                switch (key) {
                    case 'hyperfocus.enabled':
                        return true;
                    case 'hyperfocus.notificationBlocking':
                        return true;
                    case 'hyperfocus.minimumSessionMinutes':
                        return 25;
                    default:
                        return undefined;
                }
            }
        });

        hyperfocusManager = HyperfocusManager.getInstance(mockContext);
    });

    describe('getInstance', () => {
        it('should create a singleton instance', () => {
            const instance1 = HyperfocusManager.getInstance(mockContext);
            const instance2 = HyperfocusManager.getInstance(mockContext);
            expect(instance1).toBe(instance2);
        });

        it('should throw error if context is not provided on first initialization', () => {
            expect(() => HyperfocusManager.getInstance(undefined as any)).toThrow('Context is required to initialize HyperfocusManager');
        });
    });

    describe('initialize', () => {
        it('should initialize with default values if no data exists', async () => {
            (mockContext.globalState.get as jest.Mock).mockReturnValue(null);
            await hyperfocusManager.initialize();

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-hyperfocus',
                expect.objectContaining({
                    isActive: false,
                    totalMinutes: 0,
                    sessions: 0,
                    streak: 0
                })
            );
        });

        it('should load existing data if available', async () => {
            const existingData = {
                isActive: false,
                startTime: null,
                totalMinutes: 120,
                sessions: 5,
                streak: 3,
                lastSessionDate: new Date().toISOString()
            };

            (mockContext.globalState.get as jest.Mock).mockReturnValue(existingData);
            await hyperfocusManager.initialize();

            const stats = hyperfocusManager.getStats();
            expect(stats.totalMinutes).toBe(existingData.totalMinutes);
            expect(stats.sessions).toBe(existingData.sessions);
            expect(stats.streak).toBe(existingData.streak);
        });
    });

    describe('activateHyperfocus', () => {
        it('should activate hyperfocus mode', async () => {
            await hyperfocusManager.activateHyperfocus({
                reason: 'manual',
                complexity: 0
            });

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-hyperfocus',
                expect.objectContaining({
                    isActive: true,
                    startTime: expect.any(String)
                })
            );
            expect(mockStatusBarItem.show).toHaveBeenCalled();
            expect(mockNotificationBlocker.startBlocking).toHaveBeenCalled();
        });

        it('should not activate if already active', async () => {
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                isActive: true
            });

            await hyperfocusManager.activateHyperfocus({
                reason: 'manual',
                complexity: 0
            });

            expect(mockContext.globalState.update).not.toHaveBeenCalled();
            expect(vscode.window.showWarningMessage).toHaveBeenCalled();
        });

        it('should handle activation errors', async () => {
            (mockContext.globalState.update as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

            await expect(hyperfocusManager.activateHyperfocus({
                reason: 'manual',
                complexity: 0
            })).rejects.toThrow('Update failed');
        });
    });

    describe('deactivateHyperfocus', () => {
        it('should deactivate hyperfocus mode', async () => {
            // Primeiro ativar
            await hyperfocusManager.activateHyperfocus({
                reason: 'manual',
                complexity: 0
            });

            // Depois desativar
            await hyperfocusManager.deactivateHyperfocus();

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-hyperfocus',
                expect.objectContaining({
                    isActive: false,
                    startTime: null
                })
            );
            expect(mockStatusBarItem.hide).toHaveBeenCalled();
            expect(mockNotificationBlocker.stopBlocking).toHaveBeenCalled();
        });

        it('should not deactivate if not active', async () => {
            await hyperfocusManager.deactivateHyperfocus();
            expect(mockContext.globalState.update).not.toHaveBeenCalled();
            expect(vscode.window.showWarningMessage).toHaveBeenCalled();
        });

        it('should update session statistics on deactivation', async () => {
            // Simular uma sessão ativa
            const startTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutos atrás
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                isActive: true,
                startTime: startTime.toISOString(),
                totalMinutes: 60,
                sessions: 1,
                streak: 1,
                lastSessionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // ontem
            });

            await hyperfocusManager.deactivateHyperfocus();

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-hyperfocus',
                expect.objectContaining({
                    totalMinutes: 90, // 60 + 30
                    sessions: 2,
                    streak: 2
                })
            );
        });
    });

    describe('getStats', () => {
        it('should return current session stats', () => {
            const startTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutos atrás
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                isActive: true,
                startTime: startTime.toISOString(),
                totalMinutes: 120,
                sessions: 5,
                streak: 3,
                lastSessionDate: new Date().toISOString()
            });

            const stats = hyperfocusManager.getStats();
            expect(stats).toEqual(expect.objectContaining({
                todayMinutes: expect.any(Number),
                totalMinutes: 120,
                sessions: 5,
                streak: 3
            }));
        });

        it('should calculate today minutes correctly', () => {
            const startTime = new Date(Date.now() - 45 * 60 * 1000); // 45 minutos atrás
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                isActive: true,
                startTime: startTime.toISOString(),
                totalMinutes: 120,
                sessions: 5,
                streak: 3,
                lastSessionDate: new Date().toISOString()
            });

            const stats = hyperfocusManager.getStats();
            expect(stats.todayMinutes).toBeGreaterThanOrEqual(45);
        });
    });

    describe('streak management', () => {
        it('should increment streak for consecutive days', async () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                isActive: false,
                startTime: null,
                totalMinutes: 120,
                sessions: 5,
                streak: 3,
                lastSessionDate: yesterday.toISOString()
            });

            await hyperfocusManager.activateHyperfocus({
                reason: 'manual',
                complexity: 0
            });
            await hyperfocusManager.deactivateHyperfocus();

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-hyperfocus',
                expect.objectContaining({
                    streak: 4
                })
            );
        });

        it('should reset streak after missing a day', async () => {
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            (mockContext.globalState.get as jest.Mock).mockReturnValue({
                isActive: false,
                startTime: null,
                totalMinutes: 120,
                sessions: 5,
                streak: 5,
                lastSessionDate: twoDaysAgo.toISOString()
            });

            await hyperfocusManager.activateHyperfocus({
                reason: 'manual',
                complexity: 0
            });
            await hyperfocusManager.deactivateHyperfocus();

            expect(mockContext.globalState.update).toHaveBeenCalledWith(
                'dev-helper-hyperfocus',
                expect.objectContaining({
                    streak: 1
                })
            );
        });
    });

    describe('dispose', () => {
        it('should dispose status bar item', () => {
            hyperfocusManager.dispose();
            expect(mockStatusBarItem.dispose).toHaveBeenCalled();
        });

        it('should dispose notification blocker', () => {
            hyperfocusManager.dispose();
            expect(mockNotificationBlocker.dispose).toHaveBeenCalled();
        });

        it('should clear all subscriptions', () => {
            const mockDisposable = { dispose: jest.fn() };
            mockContext.subscriptions.push(mockDisposable);

            hyperfocusManager.dispose();
            expect(mockDisposable.dispose).toHaveBeenCalled();
        });
    });
}); 