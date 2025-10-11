import { auth } from '@/lib/firebase';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AutoRechargeSettings {
  lowBalanceThreshold: number;
  criticalBalanceThreshold: number;
  defaultRechargeAmount: number;
  maxRechargeAmount?: number;
  minRechargeAmount?: number;
  maxDailyRecharges: number;
  monthlySpendLimit: number;
  smartRechargeEnabled: boolean;
  emergencyRechargeEnabled?: boolean;
}

export interface AutoRechargeNotifications {
  lowBalanceAlert: boolean;
  preRechargeNotification: boolean;
  postRechargeNotification: boolean;
  failureAlerts: boolean;
}

export interface AutoRecharge {
  enabled: boolean;
  method: 'balance_trigger' | 'subscription' | 'recurring_api';
  settings: AutoRechargeSettings;
  notifications: AutoRechargeNotifications;
  billingFrequency?: 'monthly' | 'weekly' | 'daily';
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'emandate';
  last4?: string;
  cardType?: 'credit' | 'debit' | 'prepaid';
  network?: string;
  upiVPA?: string;
  bankName?: string;
  isDefault: boolean;
  isActive: boolean;
  addedAt: string;
  lastUsed?: string | null;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface PaymentPreferences {
  defaultPaymentMethod?: string | null;
  currency: string;
  invoiceEmails: boolean;
  receiptEmails: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface GSTInfo {
  gstin?: string;
  companyName?: string;
  address: Address;
}

export interface PaymentSettings {
  autoRecharge: AutoRecharge;
  savedPaymentMethods: PaymentMethod[];
  preferences: PaymentPreferences;
  gstInfo?: GSTInfo;
  lastUpdated: string;
  version: string;
}

export interface AutoRechargeStatus {
  configured: boolean;
  enabled: boolean;
  method: string;
  currentBalance: number;
  lowThreshold: number;
  criticalThreshold: number;
  isLowBalance: boolean;
  isCriticalBalance: boolean;
  willTriggerSoon: boolean;
  settings: AutoRechargeSettings;
  notifications: AutoRechargeNotifications;
  hasPaymentMethods: boolean;
  defaultPaymentMethod?: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: 'enable_auto_recharge' | 'add_payment_method' | 'set_default_payment' | 'immediate_recharge';
  priority: 'high' | 'medium' | 'low';
  message: string;
}

export interface AddPaymentMethodRequest {
  type: 'card' | 'upi' | 'emandate';
  tokenId: string;
  customerId?: string;
  last4?: string;
  cardType?: 'credit' | 'debit' | 'prepaid';
  network?: string;
  expiryMonth?: number;
  expiryYear?: number;
  upiVPA?: string;
  bankName?: string;
  isDefault?: boolean;
}

export interface CreditBalance {
  available: number;
  reserved: number;
  lifetime: number;
  lastUpdated: string;
}

export interface CreditStats {
  transactionCount: number;
  totalLoaded: number;
  totalUsed: number;
  totalRefunded: number;
}

export interface ExtendedProfile {
  profile: {
    uid: string;
    email: string;
    displayName: string;
    extendedInfo: {
      details: {
        firstName?: string;
        lastName?: string;
        address?: {
          street: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
        gstin?: {
          number: string;
          companyName: string;
        };
      };
    };
  };
  paymentSettings: PaymentSettings;
  creditBalance: CreditBalance;
  creditStats: CreditStats;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: string | string[];
  warnings?: string[];
}

export interface AutoRechargeTestRequest {
  simulateBalance: number;
}

export interface AutoRechargeTestResponse {
  simulatedBalance: number;
  lowThreshold: number;
  criticalThreshold: number;
  wouldTrigger: boolean;
  urgency: 'high' | 'medium' | 'low';
  recommendedRechargeAmount: number;
  hasPaymentMethod: boolean;
  configurationValid: boolean;
}

export interface MigrationRequest {
  dryRun?: boolean;
  batchSize?: number;
}

export interface MigrationResponse {
  summary: {
    totalUsers: number;
    needingMigration: number;
    alreadyExisted: number;
    errors: number;
    dryRun: boolean;
  };
  errors: string[];
  totalErrors: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAuthToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('No authentication token available');
  }
  return token;
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/user${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

// ============================================================================
// MAIN PAYMENT SETTINGS MANAGEMENT
// ============================================================================

/**
 * Get complete payment settings including auto-recharge, payment methods, and GST info
 */
export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  const response = await makeRequest<APIResponse<PaymentSettings>>('/payment-settings');
  return response.data!;
}

/**
 * Update complete payment settings with validation
 */
export async function updatePaymentSettings(
  settings: Partial<PaymentSettings>
): Promise<{ settings: PaymentSettings; warnings?: string[] }> {
  const response = await makeRequest<APIResponse<PaymentSettings>>('/payment-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });

  return {
    settings: response.data!,
    warnings: response.warnings,
  };
}

// ============================================================================
// AUTO-RECHARGE MANAGEMENT
// ============================================================================

/**
 * Update only auto-recharge settings without affecting other payment settings
 */
export async function updateAutoRechargeSettings(
  autoRecharge: Partial<AutoRecharge>
): Promise<AutoRecharge> {
  const response = await makeRequest<APIResponse<{ autoRecharge: AutoRecharge }>>('/payment-settings/auto-recharge', {
    method: 'PUT',
    body: JSON.stringify(autoRecharge),
  });

  return response.data!.autoRecharge;
}

/**
 * Get comprehensive auto-recharge status with recommendations
 */
export async function fetchAutoRechargeStatus(): Promise<AutoRechargeStatus> {
  const response = await makeRequest<APIResponse<AutoRechargeStatus>>('/payment-settings/auto-recharge-status');
  return response.data!;
}

/**
 * Test auto-recharge configuration with simulated balance (dev/staging only)
 */
export async function testAutoRechargeConfiguration(
  request: AutoRechargeTestRequest
): Promise<AutoRechargeTestResponse> {
  const response = await makeRequest<APIResponse<AutoRechargeTestResponse>>('/payment-settings/test-auto-recharge', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return response.data!;
}

// ============================================================================
// PAYMENT METHODS MANAGEMENT
// ============================================================================

/**
 * Add a new saved payment method
 */
export async function addPaymentMethod(
  paymentMethod: AddPaymentMethodRequest
): Promise<{ paymentMethodId: string; warnings?: string[] }> {
  const response = await makeRequest<APIResponse<{ paymentMethodId: string }>>('/payment-settings/payment-methods', {
    method: 'POST',
    body: JSON.stringify(paymentMethod),
  });

  return {
    paymentMethodId: response.data!.paymentMethodId,
    warnings: response.warnings,
  };
}

/**
 * Remove a saved payment method
 */
export async function removePaymentMethod(paymentMethodId: string): Promise<void> {
  await makeRequest(`/payment-settings/payment-methods/${paymentMethodId}`, {
    method: 'DELETE',
  });
}

/**
 * Set a payment method as default
 */
export async function setDefaultPaymentMethod(paymentMethodId: string): Promise<PaymentSettings> {
  const response = await makeRequest<APIResponse<PaymentSettings>>('/payment-settings', {
    method: 'PUT',
    body: JSON.stringify({
      preferences: {
        defaultPaymentMethod: paymentMethodId,
      },
    }),
  });

  return response.data!;
}

// ============================================================================
// ENHANCED PROFILE MANAGEMENT
// ============================================================================

/**
 * Get extended user profile with payment settings and credit information
 */
export async function fetchExtendedProfile(): Promise<ExtendedProfile> {
  const response = await makeRequest<APIResponse<ExtendedProfile>>('/profile-extended');
  return response.data!;
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Migrate payment settings for all users (Admin only)
 */
export async function migrateAllPaymentSettings(
  request: MigrationRequest = {}
): Promise<MigrationResponse> {
  const response = await makeRequest<APIResponse<MigrationResponse>>('/migrate-all-payment-settings', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return response.data!;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate auto-recharge settings before sending to API
 */
export function validateAutoRechargeSettings(settings: Partial<AutoRechargeSettings>): string[] {
  const errors: string[] = [];

  if (settings.lowBalanceThreshold !== undefined) {
    if (settings.lowBalanceThreshold < 100 || settings.lowBalanceThreshold > 10000) {
      errors.push('Low balance threshold must be between 100-10,000 credits');
    }
  }

  if (settings.criticalBalanceThreshold !== undefined) {
    if (settings.criticalBalanceThreshold < 50 || settings.criticalBalanceThreshold > 5000) {
      errors.push('Critical balance threshold must be between 50-5,000 credits');
    }
  }

  if (settings.lowBalanceThreshold && settings.criticalBalanceThreshold) {
    if (settings.criticalBalanceThreshold >= settings.lowBalanceThreshold) {
      errors.push('Critical balance threshold must be less than low balance threshold');
    }
  }

  if (settings.defaultRechargeAmount !== undefined) {
    if (settings.defaultRechargeAmount < 1000 || settings.defaultRechargeAmount > 100000) {
      errors.push('Default recharge amount must be between 1,000-100,000 credits');
    }
  }

  if (settings.maxDailyRecharges !== undefined) {
    if (settings.maxDailyRecharges < 1 || settings.maxDailyRecharges > 10) {
      errors.push('Max daily recharges must be between 1-10');
    }
  }

  if (settings.monthlySpendLimit !== undefined) {
    if (settings.monthlySpendLimit < 1000 || settings.monthlySpendLimit > 1000000) {
      errors.push('Monthly spend limit must be between ₹1,000-₹1,000,000');
    }
  }

  return errors;
}

/**
 * Validate GSTIN format
 */
export function validateGSTIN(gstin: string): boolean {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

/**
 * Format payment method display text
 */
export function formatPaymentMethodDisplay(method: PaymentMethod): string {
  switch (method.type) {
    case 'card':
      return `${method.network || 'Card'} ending in ${method.last4}`;
    case 'upi':
      return `UPI: ${method.upiVPA}`;
    case 'emandate':
      return `E-mandate: ${method.bankName}`;
    default:
      return 'Payment Method';
  }
}

/**
 * Get recommendation priority color/style
 */
export function getRecommendationStyle(priority: Recommendation['priority']): {
  color: string;
  bgColor: string;
} {
  switch (priority) {
    case 'high':
      return { color: 'text-red-600', bgColor: 'bg-red-50' };
    case 'medium':
      return { color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    case 'low':
      return { color: 'text-blue-600', bgColor: 'bg-blue-50' };
    default:
      return { color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
}

/**
 * Check if auto-recharge needs attention
 */
export function needsAutoRechargeAttention(status: AutoRechargeStatus): boolean {
  return (
    (!status.configured && status.currentBalance < 2000) ||
    (status.isCriticalBalance) ||
    (status.isLowBalance && !status.enabled) ||
    (status.enabled && !status.hasPaymentMethods) ||
    status.recommendations.some(r => r.priority === 'high')
  );
}

/**
 * Calculate recommended recharge amount based on usage patterns
 */
export function calculateRecommendedRecharge(
  currentBalance: number,
  averageDailyUsage: number,
  daysBuffer: number = 7
): number {
  const bufferAmount = averageDailyUsage * daysBuffer;
  const recommendedAmount = Math.max(bufferAmount - currentBalance, 1000);

  // Round to nearest 1000
  return Math.ceil(recommendedAmount / 1000) * 1000;
}

/**
 * Export all payment settings functions and types
 */
const paymentSettingsService = {
  // Main functions
  fetchPaymentSettings,
  updatePaymentSettings,

  // Auto-recharge functions
  updateAutoRechargeSettings,
  fetchAutoRechargeStatus,
  testAutoRechargeConfiguration,

  // Payment methods functions
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,

  // Profile functions
  fetchExtendedProfile,

  // Admin functions
  migrateAllPaymentSettings,

  // Utility functions
  validateAutoRechargeSettings,
  validateGSTIN,
  formatPaymentMethodDisplay,
  getRecommendationStyle,
  needsAutoRechargeAttention,
  calculateRecommendedRecharge,
};

export default paymentSettingsService;
