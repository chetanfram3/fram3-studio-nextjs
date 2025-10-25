'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/authStore';
import { checkUserProfile } from '@/services/userService';
import logger from '@/utils/logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let messaging: Messaging | null = null;
let db: Firestore;
let storage: ReturnType<typeof getStorage>;
const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || '(default)';

// Token refresh configuration
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds
let tokenRefreshInterval: NodeJS.Timeout | null = null;

// Cookie domain configuration
const domainBase = process.env.NEXT_PUBLIC_AVIA_URL_DOMAIN || 'fram3studio.io';
const isLocalhost = domainBase.includes('local');
const cookieDomain = `.${domainBase}`;
const isSecure = !isLocalhost;
const sameSiteValue = isLocalhost ? 'lax' : 'strict';

// Function to update token in cookie
const updateAuthToken = async (user: any) => {
  if (!user) return;

  try {
    const idToken = await user.getIdToken(true);
    const expiryDays = TOKEN_EXPIRY / (24 * 60 * 60);

    // Set the token in a cookie
    Cookies.set('auth_token', idToken, {
      domain: cookieDomain,  // ✅ Always set domain
      expires: expiryDays,
      secure: isSecure,      // false for .local domains
      sameSite: sameSiteValue // 'lax' for .local, 'strict' for production
    });

    // Debug logs

    const expiryTimestamp = new Date().getTime() + (TOKEN_EXPIRY * 1000) - (5 * 60 * 1000);
    localStorage.setItem('auth_token_expiry', expiryTimestamp.toString());

    logger.debug('Auth token updated successfully');
    return idToken;
  } catch (error) {
    console.error('Error refreshing auth token:', error);
    throw error;
  }
};

// Setup periodic token refresh
const setupTokenRefresh = (user: any) => {
  // Clear any existing interval
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }

  // Set up new interval to refresh token
  tokenRefreshInterval = setInterval(async () => {
    try {
      if (auth.currentUser) {
        await updateAuthToken(auth.currentUser);
      } else {
        clearInterval(tokenRefreshInterval!);
        tokenRefreshInterval = null;
      }
    } catch (error) {
      console.error('Token refresh interval error:', error);
    }
  }, TOKEN_REFRESH_INTERVAL);
};

// Function to check if token is about to expire
export const isTokenExpiring = () => {
  const expiryTimestamp = localStorage.getItem('auth_token_expiry');
  if (!expiryTimestamp) return true;

  const currentTime = new Date().getTime();
  const timeUntilExpiry = parseInt(expiryTimestamp) - currentTime;

  // Return true if token will expire in less than 5 minutes
  return timeUntilExpiry < 5 * 60 * 1000;
};

// Function to manually trigger token refresh
export const refreshAuthToken = async () => {
  if (auth.currentUser) {
    return updateAuthToken(auth.currentUser);
  }
  throw new Error('No authenticated user found');
};

// Only initialize on client side with proper error handling
if (typeof window !== 'undefined') {
  try {
    // Check if app is already initialized
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);

    // Initialize Firestore with custom database ID
    db = getFirestore(app, databaseId);
    storage = getStorage(app);

    // Set persistence explicitly
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn('Failed to set persistence:', error);
    });

    // Initialize messaging if supported
    isSupported().then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    }).catch((error) => {
      console.warn('Messaging not supported:', error);
    });

    // Listen for auth state changes (login/logout events)
    onAuthStateChanged(auth, async (user) => {
      const authStore = useAuthStore.getState();

      if (user) {
        try {
          authStore.setLoading(true);

          // Get fresh token and update cookie
          const idToken = await updateAuthToken(user);

          // Set up periodic token refresh
          setupTokenRefresh(user);

          // Verify profile exists
          const profileExists = await checkUserProfile(idToken);

          if (profileExists) {
            logger.debug('Auth state change: User authenticated with valid profile');
            authStore.setUser(user);
            authStore.setProfileLoaded(true);
            authStore.setError(null);
          } else {
            logger.warn('Auth state change: No profile found - triggering wizard');
            authStore.setUser(user);
            authStore.setProfileLoaded(false);
            authStore.setError(null);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          authStore.setError(err instanceof Error ? err.message : 'Authentication state change failed');
          authStore.setUser(null);
          authStore.setProfileLoaded(false);
          Cookies.remove('auth_token', { domain: cookieDomain });
          localStorage.removeItem('auth_token_expiry');

          // Clear refresh interval
          if (tokenRefreshInterval) {
            clearInterval(tokenRefreshInterval);
            tokenRefreshInterval = null;
          }

          // Optionally sign out on error
          try {
            await auth.signOut();
          } catch (signOutErr) {
            console.error('Error signing out after auth state change error:', signOutErr);
          }
        } finally {
          authStore.setLoading(false);
        }
      } else {
        logger.debug('Auth state change: User signed out');
        Cookies.remove('auth_token', { domain: cookieDomain });
        localStorage.removeItem('auth_token_expiry');

        // Clear refresh interval
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
          tokenRefreshInterval = null;
        }

        authStore.logout();
      }
    });

    // Listen for ID token changes (handles force refresh and background refresh)
    onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          await updateAuthToken(user);
        } catch (err) {
          console.error('Error handling token change:', err);
        }
      }
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

export { app, auth, messaging, db, storage };