// FIXED: src/services/fcmService.ts
// This version ensures FCM tokens are ALWAYS saved to Firestore on login

import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { useNotificationStore } from '@/store/notificationStore';
import type { Notification } from '@/types/notifications';
import { NotificationType } from '@/types/notifications';
import logger from '@/utils/logger';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
    try {
        if (!('Notification' in window)) {
            logger.warn('This browser does not support notifications');
            return false;
        }

        const permission = await window.Notification.requestPermission();
        const granted = permission === 'granted';

        useNotificationStore.getState().setPermissionGranted(granted);

        if (granted) {
            logger.debug('Notification permission granted');
        } else {
            logger.warn('Notification permission denied');
        }

        return granted;
    } catch (error) {
        logger.error('Error requesting notification permission:', error);
        return false;
    }
}

/**
 * Get FCM token
 */
export async function getFCMToken(): Promise<string | null> {
    try {
        if (!messaging) {
            logger.warn('Firebase Messaging not initialized');
            return null;
        }

        if (!VAPID_KEY) {
            logger.error('VAPID key not found in environment variables');
            return null;
        }

        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (currentToken) {
            logger.debug('FCM token obtained successfully');
            useNotificationStore.getState().setFCMToken(currentToken);

            // Save token to Firestore
            await saveFCMTokenToFirestore(currentToken);

            return currentToken;
        } else {
            logger.warn('No FCM registration token available');
            return null;
        }
    } catch (error) {
        logger.error('Error getting FCM token:', error);
        return null;
    }
}

/**
 * Save FCM token to Firestore
 * 🔧 FIXED: Added more detailed logging
 */
async function saveFCMTokenToFirestore(token: string): Promise<void> {
    try {
        const user = auth.currentUser;
        if (!user) {
            logger.warn('No authenticated user, cannot save FCM token');
            return;
        }

        logger.debug('Saving FCM token to Firestore for user:', user.uid);

        const deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            browser: getBrowserName(),
        };

        const tokenDoc = doc(db, 'users', user.uid, 'fcmTokens', token);

        await setDoc(tokenDoc, {
            token,
            deviceInfo,
            createdAt: serverTimestamp(),
            lastUsed: serverTimestamp(),
            userId: user.uid,
        }, { merge: true });

        logger.debug('✅ FCM token saved to Firestore successfully');
    } catch (error) {
        logger.error('❌ Error saving FCM token to Firestore:', error);
    }
}

/**
 * Get browser name
 */
function getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
}

/**
 * Initialize FCM foreground message listener
 */
export function initializeFCMListener(): void {
    if (!messaging) {
        logger.warn('Firebase Messaging not initialized');
        return;
    }

    onMessage(messaging, (payload) => {
        logger.debug('Foreground message received:', payload);

        const notification: Notification = {
            id: payload.messageId || Date.now().toString(),
            type: (payload.data?.type as NotificationType) || NotificationType.SYSTEM_ANNOUNCEMENT,
            title: payload.notification?.title || 'New Notification',
            body: payload.notification?.body || '',
            data: payload.data,
            read: false,
            createdAt: new Date(),
            actionUrl: payload.data?.actionUrl,
            icon: payload.notification?.icon,
            image: payload.notification?.image,
        };

        // Add to notification store
        useNotificationStore.getState().addNotification(notification);

        // Show browser notification if permission granted
        if (window.Notification.permission === 'granted') {
            new window.Notification(notification.title, {
                body: notification.body,
                icon: notification.icon || '/logo.png',
                badge: '/logo.png',
                tag: notification.id,
                data: notification.data,
            });
        }
    });

    logger.debug('FCM foreground listener initialized');
}

/**
 * Initialize FCM (request permission + get token + setup listener)
 * 🔧 FIXED: Always updates lastUsed timestamp even if token exists
 */
export async function initializeFCM(): Promise<void> {
    try {
        const { permissionGranted, fcmToken } = useNotificationStore.getState();

        // Check if notifications are blocked
        if (typeof window !== "undefined" && window.Notification?.permission === "denied") {
            logger.debug('Notifications are blocked by user');
            return;
        }

        // 🔧 FIXED: Even if we have a token, update it in Firestore to refresh lastUsed
        if (permissionGranted && fcmToken) {
            logger.debug('FCM token exists in store, updating Firestore...');

            // Update the token in Firestore (refreshes lastUsed timestamp)
            await saveFCMTokenToFirestore(fcmToken);

            // Setup foreground listener
            initializeFCMListener();
            logger.debug('FCM initialized successfully (token refreshed)');
            return;
        }

        // If permission granted but no token, get the token
        if (permissionGranted && !fcmToken) {
            logger.debug('Permission granted, fetching FCM token...');
            await getFCMToken();
            initializeFCMListener();
            logger.debug('FCM initialized successfully');
            return;
        }

        // Request permission for the first time
        const granted = await requestNotificationPermission();
        if (!granted) {
            logger.debug('User did not grant notification permission');
            return;
        }

        // Get FCM token
        await getFCMToken();

        // Setup foreground listener
        initializeFCMListener();

        logger.debug('FCM initialized successfully');
    } catch (error) {
        logger.error('Error initializing FCM:', error);
    }
}

/**
 * Delete FCM token (on logout)
 */
export async function deleteFCMToken(): Promise<void> {
    try {
        const { fcmToken } = useNotificationStore.getState();
        const user = auth.currentUser;

        if (fcmToken && user) {
            logger.debug('Deleting FCM token from Firestore');

            // Mark token as deleted in Firestore
            const tokenDoc = doc(db, 'users', user.uid, 'fcmTokens', fcmToken);
            await setDoc(tokenDoc, {
                deleted: true,
                deletedAt: serverTimestamp()
            }, { merge: true });

            // Clear from store
            useNotificationStore.getState().setFCMToken(null);
            logger.debug('✅ FCM token deleted successfully');
        }
    } catch (error) {
        logger.error('❌ Error deleting FCM token:', error);
    }
}