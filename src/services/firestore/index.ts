// src/services/firestore/index.ts

/**
 * Firestore Services Barrel Export
 * 
 * Provides centralized exports for all Firestore-based services
 * These services interact directly with Firestore (no backend API)
 * 
 * @example
 * import { acceptTermsAndPrivacy, updateCookieConsent } from '@/services/firestore';
 */

// Consent Service
export {
  saveConsentToFirestore,
  getConsentFromFirestore,
  needsConsentUpdate,
  deleteConsentFromFirestore,
  acceptTermsAndPrivacy,
  updateCookieConsent,
  getConsentHistory,
  default as firestoreConsentService,
} from "./consentService";

// Add other Firestore services here as they are created
// Example: export { ... } from './notificationService';