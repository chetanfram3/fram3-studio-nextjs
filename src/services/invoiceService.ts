// services/invoiceService.ts - Frontend Invoice Service

import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ===========================
// TYPES & INTERFACES
// ===========================

// Razorpay acquirer data structure
export interface AcquirerData {
  bank_transaction_id?: string;
  rrn?: string;
  auth_code?: string;
  upi_transaction_id?: string;
  [key: string]: string | number | boolean | undefined;
}

// Generic metadata structure
export interface InvoiceMetadata {
  source: string;
  userAgent: string;
  ipAddress: string;
  completedAt?: string;
  paymentAttempts?: number;
  paymentDuration?: number;
  failureReason?: string;
  cancellationReason?: string;
  [key: string]: string | number | boolean | undefined;
}

// Pagination last document reference
export interface PaginationLastDoc {
  id?: string;
  createdAt?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  createdAt: string;
  paidAt: string | null;
  dueDate: string;

  // Customer information
  customer: {
    userId: string;
    name: string;
    email: string;
    phone: string;
    gstin: string | null;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };

  // Package details
  package: {
    name: string;
    credits: number;
    type: string;
    description: string;
  };

  // Financial details
  amounts: {
    base: number;
    gst: number;
    total: number;
    currency: string;
  };

  // Tax information
  tax: {
    applicable: boolean;
    type: string;
    rate: number;
    hsn: string;
    cgst: number;
    sgst: number;
    igst: number;
    breakdown: {
      base: number;
      cgst: number;
      sgst: number;
      igst: number;
      total: number;
    };
  };

  // Payment details - Enhanced for all payment methods
  payment: {
    method: string;
    gateway: string;
    method_type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi' | 'unknown';
    gateway_fee: number;
    acquirer_data: AcquirerData;

    // Method-specific details
    card?: {
      last4: string;
      network: string;
      type: string;
      issuer: string;
      issuer_name?: string;
      international: boolean;
      sub_type?: string;
      card_id?: string;
      token_id?: string;
    } | null;

    upi?: {
      vpa: string;
      flow: string | null;
      payer_account_type: string | null;
      transaction_id: string;
      bank_reference: string | null;
    } | null;

    netbanking?: {
      bank_code: string;
      bank_name: string;
      bank_transaction_id: string;
      authentication_reference_number?: string;
    } | null;

    wallet?: {
      wallet_name: string;
      wallet_transaction_id: string;
      reference_id?: string;
    } | null;

    emi?: {
      issuer: string;
      rate: number;
      duration: number;
      emi_plan_id?: string;
      type: string;
      auth_code?: string;
    } | null;
  };

  // Compliance
  compliance: {
    gstCompliant: boolean;
    invoiceEligible: boolean;
    taxExempt: boolean;
  };

  // References
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  creditOperationId: string | null;

  // Metadata
  metadata: InvoiceMetadata;
}

export interface InvoiceListItem {
  invoiceId: string;
  invoiceNumber: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  package: {
    name: string;
    credits: number;
    type: string;
  };
  createdAt: string;
  paidAt: string | null;
  dueDate: string;
  paymentMethod: string;
}

export interface InvoiceStats {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  cancelled: number;
  totalAmount: number;
  paidAmount: number;
  totalCredits: number;
  paidCredits: number;
  paymentMethods: Record<string, number>;
}

export interface InvoicesPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  lastDoc: PaginationLastDoc | null;
}

// ===========================
// REQUEST/RESPONSE INTERFACES
// ===========================

export interface FetchInvoicesParams {
  status?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  limit?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FetchInvoicesResponse {
  success: boolean;
  invoices: InvoiceListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface FetchInvoiceDetailsResponse {
  success: boolean;
  invoice: Invoice;
}

export interface FetchInvoiceStatsParams {
  startDate?: string;
  endDate?: string;
}

export interface FetchInvoiceStatsResponse {
  success: boolean;
  stats: InvoiceStats;
}

export interface CancelInvoiceParams {
  invoiceId: string;
  reason?: string;
}

export interface CancelInvoiceResponse {
  success: boolean;
  message: string;
}

export interface DownloadInvoiceResponse {
  success: boolean;
  message?: string;
  invoiceData?: Invoice;
  filename?: string;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Get authentication token for API requests
 */
export async function getAuthToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Authentication required');
  }
  return token;
}

/**
 * Reusable API response handler with consistent error handling
 */
async function handleApiResponse<T>(
  response: Response,
  defaultErrorMessage: string = 'API request failed'
): Promise<T> {
  const responseData = await response.json();

  if (!response.ok) {
    console.log('🔍 Invoice API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });

    const errorMessage = responseData.error?.message ||
      responseData.error ||
      responseData.message ||
      defaultErrorMessage;

    throw new Error(errorMessage);
  }

  return responseData;
}

// ===========================
// API FUNCTIONS
// ===========================

/**
 * Fetch user's invoices with pagination and filtering
 */
export async function fetchInvoices(params: FetchInvoicesParams = {}): Promise<FetchInvoicesResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append('status', params.status);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDirection) queryParams.append('orderDirection', params.orderDirection);

  const response = await fetch(`${API_BASE_URL}/payments/invoices?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse<FetchInvoicesResponse>(response, 'Failed to fetch invoices');
}

/**
 * Fetch detailed invoice information
 */
export async function fetchInvoiceDetails(invoiceId: string): Promise<FetchInvoiceDetailsResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/payments/invoices/${invoiceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse<FetchInvoiceDetailsResponse>(response, 'Failed to fetch invoice details');
}

/**
 * Fetch invoice statistics
 */
export async function fetchInvoiceStats(params: FetchInvoiceStatsParams = {}): Promise<FetchInvoiceStatsResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams();

  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const response = await fetch(`${API_BASE_URL}/payments/invoice-stats?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse<FetchInvoiceStatsResponse>(response, 'Failed to fetch invoice statistics');
}

/**
 * Cancel a pending invoice
 */
export async function cancelInvoice(params: CancelInvoiceParams): Promise<CancelInvoiceResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/payments/invoices/${params.invoiceId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reason: params.reason || 'User cancelled'
    })
  });

  return handleApiResponse<CancelInvoiceResponse>(response, 'Failed to cancel invoice');
}

/**
 * Download invoice PDF (or get invoice data for frontend PDF generation)
 */
export async function downloadInvoice(invoiceId: string): Promise<DownloadInvoiceResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/payments/invoices/${invoiceId}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse<DownloadInvoiceResponse>(response, 'Failed to download invoice');
}

// ===========================
// UTILITY HELPER FUNCTIONS
// ===========================

/**
 * Format invoice status for display
 */
export function formatInvoiceStatus(status: string): { text: string; color: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' } {
  switch (status.toLowerCase()) {
    case 'paid':
      return { text: 'Paid', color: 'success', variant: 'success' };
    case 'pending':
      return { text: 'Pending', color: 'warning', variant: 'warning' };
    case 'failed':
      return { text: 'Failed', color: 'error', variant: 'error' };
    case 'cancelled':
      return { text: 'Cancelled', color: 'default', variant: 'default' };
    case 'refunded':
      return { text: 'Refunded', color: 'info', variant: 'info' };
    default:
      return { text: status, color: 'default', variant: 'default' };
  }
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(invoice: Invoice): string {
  if (!invoice.payment?.method_type) {
    return 'Unknown';
  }

  switch (invoice.payment.method_type) {
    case 'card':
      const card = invoice.payment.card;
      if (card) {
        return `${card.network} ${card.type} •••• ${card.last4}`;
      }
      return 'Card';

    case 'upi':
      const upi = invoice.payment.upi;
      if (upi?.vpa) {
        const domain = upi.vpa.split('@')[1];
        const providerMap: Record<string, string> = {
          'ybl': 'PhonePe',
          'paytm': 'Paytm',
          'okaxis': 'Google Pay',
          'okicici': 'Google Pay',
          'okhdfcbank': 'Google Pay',
          'oksbi': 'Google Pay',
          'amazonpay': 'Amazon Pay',
          'freecharge': 'Freecharge',
          'mobikwik': 'MobiKwik'
        };
        const provider = providerMap[domain] || domain;
        return `UPI (${provider})`;
      }
      return 'UPI';

    case 'netbanking':
      const netbanking = invoice.payment.netbanking;
      if (netbanking?.bank_name) {
        return `${netbanking.bank_name} NetBanking`;
      }
      return 'Net Banking';

    case 'wallet':
      const wallet = invoice.payment.wallet;
      if (wallet?.wallet_name) {
        const walletNames: Record<string, string> = {
          'paytm': 'Paytm Wallet',
          'phonepe': 'PhonePe Wallet',
          'amazonpay': 'Amazon Pay',
          'freecharge': 'FreeCharge',
          'mobikwik': 'MobiKwik',
          'olamoney': 'Ola Money',
          'jiomoney': 'Jio Money'
        };
        return walletNames[wallet.wallet_name] || `${wallet.wallet_name} Wallet`;
      }
      return 'Wallet';

    case 'emi':
      const emi = invoice.payment.emi;
      if (emi) {
        return `${emi.duration}-month EMI`;
      }
      return 'EMI';

    default:
      return invoice.payment.method_type;
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate invoice age in days
 */
export function getInvoiceAge(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return false;
  }
  return new Date(invoice.dueDate) < new Date();
}

/**
 * Get payment method icon name (for use with icon libraries)
 */
export function getPaymentMethodIcon(methodType: string): string {
  switch (methodType) {
    case 'card':
      return 'credit-card';
    case 'upi':
      return 'smartphone';
    case 'netbanking':
      return 'bank';
    case 'wallet':
      return 'wallet';
    case 'emi':
      return 'calendar';
    default:
      return 'payment';
  }
}

/**
 * Extract UPI provider from VPA
 */
export function getUPIProvider(vpa: string): string {
  const domain = vpa.split('@')[1];
  const providerMap: Record<string, string> = {
    'ybl': 'PhonePe',
    'paytm': 'Paytm',
    'okaxis': 'Google Pay',
    'okicici': 'Google Pay',
    'okhdfcbank': 'Google Pay',
    'oksbi': 'Google Pay',
    'amazonpay': 'Amazon Pay',
    'freecharge': 'Freecharge',
    'mobikwik': 'MobiKwik',
    'airtel': 'Airtel Payments Bank',
    'ibl': 'BHIM'
  };
  return providerMap[domain] || domain;
}