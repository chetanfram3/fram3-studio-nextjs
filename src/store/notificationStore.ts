import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification, NotificationPreferences } from '@/types/notifications';

interface NotificationState {
    // State
    notifications: Notification[];
    unreadCount: number;
    fcmToken: string | null;
    permissionGranted: boolean;
    preferences: NotificationPreferences;

    // Actions
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    setFCMToken: (token: string | null) => void;
    setPermissionGranted: (granted: boolean) => void;
    updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
    removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            // Initial state
            notifications: [],
            unreadCount: 0,
            fcmToken: null,
            permissionGranted: false,
            preferences: {
                creditAlerts: true,
                mfaCodes: true,
                projectCompletions: true,
                systemAnnouncements: true,
                realTimeUpdates: true,
            },

            // Actions
            addNotification: (notification) =>
                set((state) => {
                    const exists = state.notifications.some((n) => n.id === notification.id);
                    if (exists) return state;

                    return {
                        notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
                        unreadCount: state.unreadCount + 1,
                    };
                }),

            markAsRead: (id) =>
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    ),
                    unreadCount: Math.max(0, state.unreadCount - 1),
                })),

            markAllAsRead: () =>
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                    unreadCount: 0,
                })),

            clearNotifications: () =>
                set({
                    notifications: [],
                    unreadCount: 0,
                }),

            setFCMToken: (token) => set({ fcmToken: token }),

            setPermissionGranted: (granted) => set({ permissionGranted: granted }),

            updatePreferences: (preferences) =>
                set((state) => ({
                    preferences: { ...state.preferences, ...preferences },
                })),

            removeNotification: (id) =>
                set((state) => {
                    const notification = state.notifications.find((n) => n.id === id);
                    return {
                        notifications: state.notifications.filter((n) => n.id !== id),
                        unreadCount: notification && !notification.read
                            ? Math.max(0, state.unreadCount - 1)
                            : state.unreadCount,
                    };
                }),
        }),
        {
            name: 'notification-storage',
            partialize: (state) => ({
                notifications: state.notifications,
                unreadCount: state.unreadCount,
                fcmToken: state.fcmToken,
                permissionGranted: state.permissionGranted,
                preferences: state.preferences,
            }),
        }
    )
);