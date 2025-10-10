export enum NotificationType {
    CREDIT_ALERT = 'credit_alert',
    MFA_CODE = 'mfa_code',
    PROJECT_COMPLETION = 'project_completion',
    SYSTEM_ANNOUNCEMENT = 'system_announcement',
    REAL_TIME_UPDATE = 'real_time_update',
}

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    read: boolean;
    createdAt: Date;
    actionUrl?: string;
    icon?: string;
    image?: string;
}

export interface FCMToken {
    token: string;
    deviceInfo: {
        userAgent: string;
        platform: string;
        browser: string;
    };
    createdAt: Date;
    lastUsed: Date;
}

export interface NotificationPreferences {
    creditAlerts: boolean;
    mfaCodes: boolean;
    projectCompletions: boolean;
    systemAnnouncements: boolean;
    realTimeUpdates: boolean;
}