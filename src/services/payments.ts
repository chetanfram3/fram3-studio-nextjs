import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ===== INTERFACES =====
export interface GSTConfig {
    rate: number;
    hsnCode: string;
    mandatory: boolean;
    businessState: string;
    businessGSTIN: string;
    description: string;
    components: {
        intraState: { cgst: number; sgst: number; description: string };
        interState: { igst: number; description: string };
    };
}

export interface TaxDetails {
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    taxType: "CGST+SGST" | "IGST";
    isInterState: boolean;
    customerType: "B2B" | "B2C";
    breakdown: {
        cgst: number;
        sgst: number;
        igst: number;
    };
}

export interface CustomerDetails {
    name: string;
    email: string;
    phone: string;
    gstin?: string;
    companyName?: string;
    address: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

export interface EnhancedOrderData {
    credits: number;
    amount: number; // This should be tax-inclusive total amount
    packageInfo?: PackageInfo;
    customerDetails?: CustomerDetails;
    taxDetails?: TaxDetails;
}

export interface ValidationConfig {
    minCredits: number;
    maxCredits: number;
    minAmount: number; // Now refers to base amount before tax
    maxAmount: number; // Now refers to base amount before tax
    maxPricePerCredit: number;
    minPricePerCredit: number;
    currency: string;
}

export interface RazorpayConfig {
    keyId: string;
    supportedMethods: string[];
    supportedCurrencies: string[];
}

export interface SuggestedPackage {
    credits: number;
    suggestedPrice: number; // This is base price before tax
    name: string;
    discount?: number;
}

// ✅ ENHANCED: PaymentConfig now includes GST
export interface PaymentConfig {
    validation: ValidationConfig;
    razorpay: RazorpayConfig;
    gst: GSTConfig; // ✅ NEW: GST configuration
    suggestions: {
        popularPackages: SuggestedPackage[];
    };
    customPricing: {
        basePricePerCredit: number;
        discountTiers: unknown[];
        maxDiscount: number;
        currency: string;
        note: string;
    };
}

export interface PackageInfo {
    name?: string;
    type?: 'popular' | 'custom' | 'promotional';
    discount?: number;
    originalPrice?: number;
}

export interface PackageDetails {
    credits: number;
    baseAmount: number; // ✅ CHANGED: Now stores base amount
    totalAmount: number; // ✅ NEW: Tax-inclusive total
    pricePerCredit: number;
    currency: string;
    isValid: boolean;
}

// ✅ ENHANCED: CreateOrderParams now supports enhanced data
export interface CreateOrderParams extends EnhancedOrderData {
    credits: number;
    amount: number; // Tax-inclusive total amount
    packageInfo?: PackageInfo;
    customerDetails?: CustomerDetails;
    taxDetails?: TaxDetails;
}

// ✅ ENHANCED: CreateOrderResponse with GST details
export interface CreateOrderResponse {
    orderId: string;
    amount: number; // Tax-inclusive amount in paise
    currency: string;
    receipt: string;
    packageDetails: PackageDetails;
    taxDetails: TaxDetails; // ✅ NEW: Tax breakdown
    customerDetails: CustomerDetails;
    packageInfo: PackageInfo;
    gstCompliance: { // ✅ NEW: GST compliance info
        hsnCode: string;
        businessGSTIN: string;
        gstRate: number;
    };
    key_id: string;
}

export interface VerifyPaymentParams {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface PaymentDetails {
    id: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    captured_at?: number;
}

export interface OrderDetails {
    id: string;
    receipt: string;
    status: string;
}

export interface CreditTransaction {
    loaded: number;
    previousBalance: number;
    newBalance: number;
    transactionId: string;
}

// ✅ ENHANCED: PackageResult with GST breakdown
export interface PackageResult {
    baseAmount: number; // ✅ NEW: Base amount before tax
    gstAmount: number; // ✅ NEW: GST amount
    totalAmount: number; // ✅ NEW: Total including GST
    taxType: string; // ✅ NEW: CGST+SGST or IGST
    pricePerCredit: number;
    discountApplied: number;
    savings: number;
}

// ✅ ENHANCED: VerifyPaymentResponse with GST compliance
export interface VerifyPaymentResponse {
    status: string;
    message: string;
    payment: PaymentDetails;
    order: OrderDetails;
    credits: CreditTransaction;
    package: PackageResult;
    gstCompliance: { // ✅ NEW: GST compliance confirmation
        hsnCode: string;
        gstRate: number;
        taxType: string;
        customerType: string;
        invoiceEligible: boolean;
        businessGSTIN: string;
        customerGSTIN: string | null;
    };
    dualTrackingSuccess: boolean;
}

export interface Balance {
    available: number;
    reserved: number;
    totalAvailable: number;
    lifetime: number;
}

export interface BalanceResponse {
    balance: Balance;
    lastUpdated: string;
    lastSynced: string;
}

// ✅ ENHANCED: HistoryTransaction with tax details
export interface HistoryTransaction {
    id: string;
    credits: number;
    timestamp: string;
    reason: string;
    source?: string;
    paymentMethod?: string;
    paymentId?: string;
    orderId?: string;
    receiptId?: string;
    price?: number;
    currency?: string;
    packageType?: string;
    packageName?: string;
    pricePerCredit?: number;
    discountApplied?: number;
    calculatedByFrontend?: boolean;
    dualTrackingSuccess?: boolean;
    taxDetails?: TaxDetails; // ✅ NEW: Tax breakdown in history
    gstCompliant?: boolean; // ✅ NEW: GST compliance flag
}

export interface PaymentHistory {
    transactions: HistoryTransaction[];
    total: number;
}

export interface PaymentMethod {
    type: string;
    name: string;
    enabled: boolean;
    description?: string;
    processing_fee?: number;
}

export interface PricingTier {
    credits: number;
    price: number; // Base price before tax
    pricePerCredit: number;
    discount?: number;
    savings?: number;
    popular?: boolean;
}

export interface CurrencyInfo {
    code: string;
    symbol: string;
    creditsPerUnit: number;
}

export interface PaymentMethodsResponse {
    methods: PaymentMethod[];
    pricingTiers: PricingTier[];
    currency: CurrencyInfo;
}

export interface OrderStatusDetails {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    created_at: number;
    status: string;
}

export interface OrderCreditsInfo {
    amount: number;
    pricePerCredit: number;
    packageName?: string;
    loaded: boolean;
}

export interface PaymentStatusInfo {
    id: string;
    status: string;
    method: string;
    amount: number;
    created_at: number;
    captured_at?: number;
}

export interface OrderStatusResponse {
    order: OrderStatusDetails;
    status: string;
    credits: OrderCreditsInfo;
    payments: PaymentStatusInfo[];
}

export interface AnalyticsPeriod {
    start: string;
    end: string;
    days: number;
}

export interface PaymentSummary {
    totalPurchases: number;
    totalAmount: number;
    totalCredits: number;
    averageOrderValue: number;
    averageCreditsPerPurchase: number;
    preferredPaymentMethod: string;
}

export interface PaymentTrend {
    date: string;
    purchases: number;
    amount: number;
    credits: number;
}

export interface PaymentInsights {
    mostPopularPackage?: string;
    bestValuePackage?: string;
    recommendedNextPurchase?: PricingTier;
    spendingPattern?: string;
}

export interface PaymentAnalyticsResponse {
    period: AnalyticsPeriod;
    summary: PaymentSummary;
    trends: PaymentTrend[];
    insights: PaymentInsights;
}

export interface CancelOrderParams {
    reason: string;
}

export interface CancelOrderResponse {
    orderId: string;
    status: string;
    cancelled_at: string;
    reason: string;
}

// ✅ NEW: GST Calculation interfaces
export interface GSTCalculationRequest {
    baseAmount: number;
    customerState?: string;
    customerGstin?: string;
}

export interface GSTCalculationResponse {
    baseAmount: number;
    gstRate: number;
    gstAmount: number;
    totalAmount: number;
    taxType: "CGST+SGST" | "IGST";
    isInterState: boolean;
    customerType: "B2B" | "B2C";
    hsnCode: string;
    breakdown: {
        cgst: number;
        sgst: number;
        igst: number;
    };
    businessDetails: {
        gstin: string;
        state: string;
    };
    customerDetails: {
        gstin: string | null;
        state: string | null;
    };
}

// ===== UTILITY FUNCTIONS =====

async function getAuthToken(): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
        throw new Error('Authentication required');
    }
    return token;
}

// ===== API FUNCTIONS =====

/**
 * ✅ ENHANCED: Get payment configuration with GST details
 */
export async function getPaymentConfig(): Promise<{ data: PaymentConfig }> {
    const response = await fetch(`${API_BASE_URL}/payments/config`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to fetch payment configuration');
    }

    const data = await response.json();

    // Ensure GST config is available
    if (!data.data.gst) {
        console.warn("GST configuration missing from backend");
    }

    return data;
}

/**
 * ✅ NEW: Calculate GST for given base amount
 */
export async function calculateGST(
    baseAmount: number,
    customerState?: string,
    customerGstin?: string
): Promise<{ data: GSTCalculationResponse }> {
    const response = await fetch(`${API_BASE_URL}/payments/calculate-gst`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            baseAmount,
            customerState,
            customerGstin
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to calculate GST');
    }

    return response.json();
}

/**
 * ✅ ENHANCED: Validate package using base amount (pre-tax)
 */
export async function validatePackage(
    credits: number,
    baseAmount: number // Now validates base amount before tax
): Promise<{ data: { isValid: boolean; packageDetails: PackageDetails; message: string } }> {
    const response = await fetch(`${API_BASE_URL}/payments/validate-package`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credits, amount: baseAmount })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Package validation failed');
    }

    return response.json();
}

/**
 * ✅ ENHANCED: Create Razorpay order with GST compliance
 */
export async function createOrder(params: CreateOrderParams): Promise<{ data: CreateOrderResponse }> {
    const token = await getAuthToken();

    console.log("🚀 Creating GST-compliant order:", params);

    const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to create order');
    }

    const result = await response.json();
    console.log("✅ GST-compliant order created:", result);

    return result;
}

/**
 * Verify Razorpay payment and load credits (enhanced with GST details)
 */
export async function verifyPayment(params: VerifyPaymentParams): Promise<{ data: VerifyPaymentResponse }> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/payments/verify-payment`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Payment verification failed');
    }

    return response.json();
}

/**
 * Get current credit balance
 */
export async function getCreditBalance(): Promise<{ data: BalanceResponse }> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/payments/balance`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to fetch credit balance');
    }

    return response.json();
}

/**
 * Get credit loading transaction history (enhanced with GST details)
 */
export async function getPaymentHistory(params?: { limit?: number; type?: string }): Promise<{ data: PaymentHistory }> {
    const token = await getAuthToken();

    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);

    const url = `${API_BASE_URL}/payments/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to fetch payment history');
    }

    return response.json();
}

/**
 * Get available payment methods and pricing tiers
 */
export async function getPaymentMethods(): Promise<{ data: PaymentMethodsResponse }> {
    const response = await fetch(`${API_BASE_URL}/payments/payment-methods`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to fetch payment methods');
    }

    return response.json();
}

/**
 * Get order status and payment details
 */
export async function getOrderStatus(orderId: string): Promise<{ data: OrderStatusResponse }> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/payments/order-status/${orderId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to fetch order status');
    }

    return response.json();
}

/**
 * Get payment and purchase analytics
 */
export async function getPaymentAnalytics(params?: { period?: string; groupBy?: string }): Promise<{ data: PaymentAnalyticsResponse }> {
    const token = await getAuthToken();

    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.groupBy) queryParams.append('groupBy', params.groupBy);

    const url = `${API_BASE_URL}/payments/analytics${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to fetch payment analytics');
    }

    return response.json();
}

/**
 * Cancel a pending order
 */
export async function cancelOrder(orderId: string, params: CancelOrderParams): Promise<{ data: CancelOrderResponse }> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/payments/cancel-order/${orderId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to cancel order');
    }

    return response.json();
}

// ===== UTILITY FUNCTIONS FOR FRONTEND =====

/**
 * ✅ ENHANCED: Calculate dynamic pricing (returns base prices before tax)
 */
export function calculateDynamicPrice(credits: number, options?: {
    userType?: 'regular' | 'premium' | 'enterprise' | 'new_user';
    promoCode?: string;
    timeBonus?: boolean;
}): {
    price: number; // Base price before tax
    pricePerCredit: number;
    discount: number;
    savings: number;
    bonusCredits: number;
    totalCredits: number;
} {
    const baseRate = 0.09; // ₹0.09 per credit
    let basePrice = credits * baseRate;
    let discount = 0;
    let bonusCredits = 0;

    // Bulk discounts
    if (credits >= 100000) {
        discount = 28; // 28% off
        basePrice *= 0.72;
    } else if (credits >= 50000) {
        discount = 22; // 22% off
        basePrice *= 0.78;
    } else if (credits >= 10000) {
        discount = 17; // 17% off
        basePrice *= 0.83;
    } else if (credits >= 5000) {
        discount = 11; // 11% off
        basePrice *= 0.89;
    }

    // User type discounts
    if (options?.userType) {
        const userDiscounts: Record<string, number> = {
            'enterprise': 0.20,  // 20% additional off
            'premium': 0.10,     // 10% additional off
            'new_user': 0.15,    // 15% additional off for new users
            'regular': 0.00      // No additional discount for regular users
        };

        const additionalDiscount = userDiscounts[options.userType] || 0;
        if (additionalDiscount > 0) {
            basePrice *= (1 - additionalDiscount);
            discount += additionalDiscount * 100;
        }
    }

    // Promo codes
    if (options?.promoCode) {
        const promoCodes: Record<string, number> = {
            'SAVE20': 0.20,
            'WELCOME': 0.15,
            'BULK50': 0.25,
            'FIRST10': 0.10
        };

        const promoDiscount = promoCodes[options.promoCode];
        if (promoDiscount) {
            basePrice *= (1 - promoDiscount);
            discount += promoDiscount * 100;
        }
    }

    // Time-based bonuses
    if (options?.timeBonus) {
        const hour = new Date().getHours();
        let timeMultiplier = 1.0;

        if (hour >= 22 || hour <= 6) {
            timeMultiplier = 1.1; // 10% bonus at night
        } else if (hour >= 12 && hour <= 14) {
            timeMultiplier = 1.05; // 5% bonus at lunch
        }

        bonusCredits = Math.floor(credits * (timeMultiplier - 1));
    }

    const finalPrice = Math.round(basePrice);
    const originalPrice = credits * baseRate;
    const savings = originalPrice - finalPrice;
    const totalCredits = credits + bonusCredits;

    return {
        price: finalPrice, // This is base price before tax
        pricePerCredit: finalPrice / credits,
        discount: Math.round(discount),
        savings: Math.round(savings),
        bonusCredits,
        totalCredits
    };
}

/**
 * ✅ ENHANCED: Validate credit package (now validates base amount)
 */
export function validateCreditPackage(
    credits: number,
    baseAmount: number, // Now validates base amount before tax
    config?: ValidationConfig
): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!config) {
        return { isValid: false, errors: ['Configuration not loaded'] };
    }

    if (credits < config.minCredits || credits > config.maxCredits) {
        errors.push(`Credits must be between ${config.minCredits.toLocaleString()} and ${config.maxCredits.toLocaleString()}`);
    }

    // Now validates base amount before tax
    if (baseAmount < config.minAmount || baseAmount > config.maxAmount) {
        errors.push(`Base amount must be between ₹${config.minAmount} and ₹${config.maxAmount.toLocaleString()}`);
    }

    if (credits > 0 && baseAmount > 0) {
        const pricePerCredit = baseAmount / credits;

        if (pricePerCredit > config.maxPricePerCredit) {
            errors.push(`Price per credit (₹${pricePerCredit.toFixed(4)}) exceeds maximum (₹${config.maxPricePerCredit})`);
        }

        if (pricePerCredit < config.minPricePerCredit) {
            errors.push(`Price per credit (₹${pricePerCredit.toFixed(4)}) is below minimum (₹${config.minPricePerCredit})`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Format currency for display
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
 * Format credits for display
 */
export function formatCredits(credits: number): string {
    if (credits >= 1000000) {
        return `${(credits / 1000000).toFixed(1)}M`;
    } else if (credits >= 1000) {
        return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toLocaleString();
}

/**
 * ✅ ENHANCED: Get suggested packages (returns base prices before tax)
 */
export function getSuggestedPackages(options?: {
    userType?: 'regular' | 'premium' | 'enterprise' | 'new_user';
    promoCode?: string;
}): SuggestedPackage[] {
    const basePackages = [
        { credits: 1000, name: "Starter Pack" },
        { credits: 5000, name: "Value Pack" },
        { credits: 10000, name: "Pro Pack" },
        { credits: 50000, name: "Business Pack" },
        { credits: 100000, name: "Enterprise Pack" }
    ];

    return basePackages.map(pkg => {
        const pricing = calculateDynamicPrice(pkg.credits, options);
        return {
            ...pkg,
            suggestedPrice: pricing.price, // Base price before tax
            discount: pricing.discount
        };
    });
}