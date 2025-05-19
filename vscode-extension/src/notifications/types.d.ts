export interface BlockedNotification {
    type: string;
    message: string;
    timestamp: number;
}

export declare class NotificationBlocker {
    constructor();
    initialize(): void;
    dispose(): void;
    startBlocking(): void;
    stopBlocking(): void;
    showBlockedNotifications(): void;
} 