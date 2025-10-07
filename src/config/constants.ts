// src/config/constants.ts

/**
 * API Base URL from environment variable
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * Firebase configuration
 */
export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Application constants
 */
export const APP_NAME = 'FRAM3 Studio';
export const APP_VERSION = '1.0.0';
export const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = ['en', 'es', 'fr'];

/**
 * Profile constants
 */
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;
export const MIN_PASSWORD_LENGTH = 8;

/**
 * UI constants
 */
export const MOBILE_BREAKPOINT = 600;
export const TABLET_BREAKPOINT = 900;
export const DESKTOP_BREAKPOINT = 1200;