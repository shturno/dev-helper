import * as vscode from 'vscode';
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
            tooltip: ''
        }))
    },
    StatusBarAlignment: { Right: 2 }
}));

describe('NotificationBlocker', () => {
    let blocker: NotificationBlocker;
    let mockContext: vscode.ExtensionContext;
    let mockStatusBarItem: vscode.StatusBarItem;

    beforeEach(() => {
        mockContext = {
            globalState: {
                get: jest.fn(),
                update: jest.fn()
            },
            subscriptions: []
        } as unknown as vscode.ExtensionContext;

        jest.clearAllMocks();
        mockStatusBarItem = {
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
            text: '',
            tooltip: ''
        } as unknown as vscode.StatusBarItem;

        (vscode.window.createStatusBarItem as jest.Mock).mockReturnValue(mockStatusBarItem);
        blocker = new NotificationBlocker(mockContext);
    });

    afterEach(() => {
        blocker.dispose();
    });

    describe('startBlocking', () => {
        it('should start blocking notifications and show status bar item', () => {
            blocker.startBlocking();
            expect(mockStatusBarItem.show).toHaveBeenCalled();
            expect(mockStatusBarItem.text).toContain('🔕');
            expect(mockStatusBarItem.tooltip).toContain('Notificações bloqueadas');
        });

        it('should not start blocking if already blocking', () => {
            blocker.startBlocking();
            const initialShowCalls = (mockStatusBarItem.show as jest.Mock).mock.calls.length;
            
            blocker.startBlocking();
            expect(mockStatusBarItem.show).toHaveBeenCalledTimes(initialShowCalls);
        });
    });

    describe('stopBlocking', () => {
        it('should stop blocking notifications and hide status bar item', () => {
            blocker.startBlocking();
            blocker.stopBlocking();
            
            expect(mockStatusBarItem.hide).toHaveBeenCalled();
        });

        it('should not stop blocking if not blocking', () => {
            blocker.stopBlocking();
            expect(mockStatusBarItem.hide).not.toHaveBeenCalled();
        });

        it('should show blocked notifications when stopping', () => {
            // Simular algumas notificações bloqueadas
            (blocker as any).blockedNotifications = [
                { message: 'Test notification 1' },
                { message: 'Test notification 2' }
            ];

            blocker.startBlocking();
            blocker.stopBlocking();

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('2 notificações bloqueadas'),
                'Ver Notificações'
            );
        });
    });

    describe('blockNotification', () => {
        it('should block notification when blocking is active', () => {
            blocker.startBlocking();
            const message = 'Test notification';
            const shouldBlock = blocker.blockNotification(message);
            expect(shouldBlock).toBe(true);
            expect((blocker as any).blockedNotifications[0].message).toBe(message);
        });

        it('should not block notification when blocking is inactive', () => {
            const message = 'Test notification';
            const shouldBlock = blocker.blockNotification(message);
            expect(shouldBlock).toBe(false);
            expect((blocker as any).blockedNotifications).toHaveLength(0);
        });

        it('should not block empty notifications', () => {
            blocker.startBlocking();
            const message = '';
            const shouldBlock = blocker.blockNotification(message);
            expect(shouldBlock).toBe(false);
            expect((blocker as any).blockedNotifications).toHaveLength(0);
        });
    });

    describe('showBlockedNotifications', () => {
        it('should show message when no notifications are blocked', () => {
            blocker.showBlockedNotifications();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Nenhuma notificação bloqueada'
            );
        });

        it('should show blocked notifications in a list', () => {
            // Simular algumas notificações bloqueadas
            (blocker as any).blockedNotifications = [
                { message: 'Test notification 1' },
                { message: 'Test notification 2' }
            ];

            blocker.showBlockedNotifications();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Notificações bloqueadas'),
                'Test notification 1',
                'Test notification 2'
            );
        });

        it('should clear blocked notifications after showing', () => {
            (blocker as any).blockedNotifications = [
                { message: 'Test notification' }
            ];

            blocker.showBlockedNotifications();
            expect((blocker as any).blockedNotifications).toHaveLength(0);
        });
    });

    describe('dispose', () => {
        it('should dispose status bar item', () => {
            blocker.dispose();
            expect(mockStatusBarItem.dispose).toHaveBeenCalled();
        });

        it('should clear blocked notifications', () => {
            (blocker as any).blockedNotifications = [
                { message: 'Test notification' }
            ];

            blocker.dispose();
            expect((blocker as any).blockedNotifications).toHaveLength(0);
        });
    });
}); 