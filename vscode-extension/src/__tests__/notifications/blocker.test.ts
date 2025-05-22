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
    let notificationBlocker: NotificationBlocker;
    let mockStatusBarItem: vscode.StatusBarItem;

    beforeEach(() => {
        jest.clearAllMocks();
        mockStatusBarItem = {
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
            text: '',
            tooltip: ''
        } as unknown as vscode.StatusBarItem;

        (vscode.window.createStatusBarItem as jest.Mock).mockReturnValue(mockStatusBarItem);
        notificationBlocker = new NotificationBlocker();
    });

    afterEach(() => {
        notificationBlocker.dispose();
    });

    describe('startBlocking', () => {
        it('should start blocking notifications and show status bar item', () => {
            notificationBlocker.startBlocking();
            expect(mockStatusBarItem.show).toHaveBeenCalled();
            expect(mockStatusBarItem.text).toContain('🔕');
            expect(mockStatusBarItem.tooltip).toContain('Notificações bloqueadas');
        });

        it('should not start blocking if already blocking', () => {
            notificationBlocker.startBlocking();
            const initialShowCalls = (mockStatusBarItem.show as jest.Mock).mock.calls.length;
            
            notificationBlocker.startBlocking();
            expect(mockStatusBarItem.show).toHaveBeenCalledTimes(initialShowCalls);
        });
    });

    describe('stopBlocking', () => {
        it('should stop blocking notifications and hide status bar item', () => {
            notificationBlocker.startBlocking();
            notificationBlocker.stopBlocking();
            
            expect(mockStatusBarItem.hide).toHaveBeenCalled();
        });

        it('should not stop blocking if not blocking', () => {
            notificationBlocker.stopBlocking();
            expect(mockStatusBarItem.hide).not.toHaveBeenCalled();
        });

        it('should show blocked notifications when stopping', () => {
            // Simular algumas notificações bloqueadas
            (notificationBlocker as any).blockedNotifications = [
                { message: 'Test notification 1' },
                { message: 'Test notification 2' }
            ];

            notificationBlocker.startBlocking();
            notificationBlocker.stopBlocking();

            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('2 notificações bloqueadas'),
                'Ver Notificações'
            );
        });
    });

    describe('blockNotification', () => {
        it('should block notification when blocking is active', () => {
            notificationBlocker.startBlocking();
            const message = 'Test notification';
            const shouldBlock = notificationBlocker.blockNotification(message);
            expect(shouldBlock).toBe(true);
            expect((notificationBlocker as any).blockedNotifications[0].message).toBe(message);
        });

        it('should not block notification when blocking is inactive', () => {
            const message = 'Test notification';
            const shouldBlock = notificationBlocker.blockNotification(message);
            expect(shouldBlock).toBe(false);
            expect((notificationBlocker as any).blockedNotifications).toHaveLength(0);
        });

        it('should not block empty notifications', () => {
            notificationBlocker.startBlocking();
            const message = '';
            const shouldBlock = notificationBlocker.blockNotification(message);
            expect(shouldBlock).toBe(false);
            expect((notificationBlocker as any).blockedNotifications).toHaveLength(0);
        });
    });

    describe('showBlockedNotifications', () => {
        it('should show message when no notifications are blocked', () => {
            notificationBlocker.showBlockedNotifications();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Nenhuma notificação bloqueada'
            );
        });

        it('should show blocked notifications in a list', () => {
            // Simular algumas notificações bloqueadas
            (notificationBlocker as any).blockedNotifications = [
                { message: 'Test notification 1' },
                { message: 'Test notification 2' }
            ];

            notificationBlocker.showBlockedNotifications();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                expect.stringContaining('Notificações bloqueadas'),
                'Test notification 1',
                'Test notification 2'
            );
        });

        it('should clear blocked notifications after showing', () => {
            (notificationBlocker as any).blockedNotifications = [
                { message: 'Test notification' }
            ];

            notificationBlocker.showBlockedNotifications();
            expect((notificationBlocker as any).blockedNotifications).toHaveLength(0);
        });
    });

    describe('dispose', () => {
        it('should dispose status bar item', () => {
            notificationBlocker.dispose();
            expect(mockStatusBarItem.dispose).toHaveBeenCalled();
        });

        it('should clear blocked notifications', () => {
            (notificationBlocker as any).blockedNotifications = [
                { message: 'Test notification' }
            ];

            notificationBlocker.dispose();
            expect((notificationBlocker as any).blockedNotifications).toHaveLength(0);
        });
    });
}); 