import { auth } from '@/lib/firebase';
import { formatCurrency, formatCredits } from './payments';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Razorpay-specific types
export interface RazorpayAcquirerData {
    bank_transaction_id?: string;
    rrn?: string;
    auth_code?: string;
    upi_transaction_id?: string;
    [key: string]: string | number | boolean | undefined;
}

export interface RazorpayOrderData {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, string | number>;
    created_at: number;
    [key: string]: string | number | boolean | Record<string, unknown> | undefined;
}

export interface RazorpayPaymentData {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    order_id: string;
    method: string;
    captured: boolean;
    email: string;
    contact: string;
    fee?: number;
    tax?: number;
    acquirer_data?: RazorpayAcquirerData;
    created_at: number;
    [key: string]: string | number | boolean | RazorpayAcquirerData | undefined;
}

export interface RazorpayOrderSummary {
    orderId: string;
    receiptId: string;
    paymentId: string | null;
    paymentMethod: string | null;
    orderCreatedAt: string;
    paymentCapturedAt: string | null;
    totalAmount: number;
    currency: string;
    credits: number;
    baseAmount: number;
    gstAmount: number;
    packageName: string;
    packageType: string;
    taxType: string;
    customerType: string;
    hsnCode: string;
    businessGSTIN: string;
    customerGSTIN: string | null;
    customerName: string;
    customerEmail: string;
    status: string;
    gstCompliant: boolean;
    invoiceEligible: boolean;
    error?: string;
}

export interface OrdersSummary {
    totalOrders: number;
    totalCredits: number;
    totalValue: number;
    totalGST: number;
    dateRange: {
        earliest: string;
        latest: string;
    } | null;
}

export interface OrdersDebugInfo {
    razorpayTotal: number;
    userFiltered: number;
    finalProcessed: number;
    userId: string;
}

export interface RazorpayOrdersResponse {
    orders: RazorpayOrderSummary[];
    total: number;
    invoiceEligible: number;
    summary: OrdersSummary;
    debug: OrdersDebugInfo;
}

export interface PurchaseDetails {
    credits: number;
    totalAmount: number;
    baseAmount: number;
    gstAmount: number;
    packageName: string;
    packageType: string;
    pricePerCredit: number;
}

export interface PaymentDetailsComplete {
    method: string;
    bank: string | null;
    wallet: string | null;
    card: {
        network?: string;
        type?: string;
        issuer?: string;
    } | null;
    upi: {
        vpa?: string;
    } | null;
    acquirerData: RazorpayAcquirerData;
    fees: number;
    tax: number;
}

export interface TaxDetailsComplete {
    taxType: "IGST" | "CGST+SGST";
    customerType: "B2B" | "B2C";
    hsnCode: string;
    gstRate: number;
    businessGSTIN: string;
    customerGSTIN: string | null;
    breakdown: {
        cgst: number;
        sgst: number;
        igst: number;
    };
}

export interface CustomerDetailsComplete {
    userId: string;
    name: string;
    email: string;
    phone: string;
    gstin: string | null;
    company: string;
}

export interface CompleteOrderDetails {
    orderId: string;
    receiptId: string;
    paymentId: string;
    orderCreatedAt: string;
    paymentCapturedAt: string;
    purchase: PurchaseDetails;
    payment: PaymentDetailsComplete;
    tax: TaxDetailsComplete;
    customer: CustomerDetailsComplete;
    gstCompliant: boolean;
    invoiceReady: boolean;
    rawData?: {
        order: RazorpayOrderData;
        payment: RazorpayPaymentData;
        allPayments: RazorpayPaymentData[];
    };
}

export interface RazorpayOrderDetailsResponse {
    data: CompleteOrderDetails;
}

async function getAuthToken(): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
        throw new Error('Authentication required');
    }
    return token;
}

/**
 * ✅ NEW: Get all Razorpay credit purchase orders for invoice generation
 * Fetches orders directly from Razorpay API, filtered by user and paid status
 */
export async function getRazorpayOrders(params?: {
    limit?: number;
    from?: number;
    to?: number;
    status?: 'paid' | 'created' | 'attempted' | 'failed';
}): Promise<{ data: RazorpayOrdersResponse }> {
    const token = await getAuthToken();

    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.from) queryParams.append('from', params.from.toString());
    if (params?.to) queryParams.append('to', params.to.toString());
    if (params?.status) queryParams.append('status', params.status);

    const url = `${API_BASE_URL}/payments/razorpay-orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    console.log("🔥 Fetching Razorpay orders:", url);

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || 'Failed to fetch Razorpay orders');
    }

    const result = await response.json();
    console.log("✅ Razorpay orders fetched:", {
        total: result.data.total,
        invoiceEligible: result.data.invoiceEligible
    });

    return result;
}

/**
 * ✅ NEW: Get specific Razorpay order with complete invoice data
 * Fetches complete order details including payment info, tax breakdown, and customer data
 */
export async function getRazorpayOrderDetails(orderId: string): Promise<RazorpayOrderDetailsResponse> {
    const token = await getAuthToken();

    console.log("🔥 Fetching Razorpay order details:", orderId);

    const response = await fetch(`${API_BASE_URL}/payments/razorpay-orders/${orderId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.description || 'Failed to fetch order details';

        // Handle specific error types
        if (response.status === 403) {
            throw new Error('This order does not belong to your account');
        } else if (response.status === 404) {
            throw new Error(`Order ${orderId} not found or has no successful payment`);
        }

        throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("✅ Order details fetched:", {
        orderId: result.data.orderId,
        invoiceReady: result.data.invoiceReady,
        gstCompliant: result.data.gstCompliant
    });

    return result;
}

// ===== UTILITY FUNCTIONS FOR RAZORPAY ORDERS =====

/**
 * ✅ NEW: Filter orders by invoice eligibility
 */
export function filterInvoiceEligibleOrders(orders: RazorpayOrderSummary[]): RazorpayOrderSummary[] {
    return orders.filter(order => order.invoiceEligible && order.gstCompliant);
}

/**
 * ✅ NEW: Group orders by date
 */
export function groupOrdersByDate(orders: RazorpayOrderSummary[]): Record<string, RazorpayOrderSummary[]> {
    return orders.reduce((groups, order) => {
        const date = new Date(order.orderCreatedAt).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(order);
        return groups;
    }, {} as Record<string, RazorpayOrderSummary[]>);
}

/**
 * ✅ NEW: Calculate total spent from orders
 */
export function calculateOrderSummary(orders: RazorpayOrderSummary[]): {
    totalOrders: number;
    totalAmount: number;
    totalCredits: number;
    totalGST: number;
    averageOrderValue: number;
    averageCreditsPerOrder: number;
} {
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalCredits = orders.reduce((sum, order) => sum + order.credits, 0);
    const totalGST = orders.reduce((sum, order) => sum + order.gstAmount, 0);

    return {
        totalOrders,
        totalAmount,
        totalCredits,
        totalGST,
        averageOrderValue: totalOrders > 0 ? totalAmount / totalOrders : 0,
        averageCreditsPerOrder: totalOrders > 0 ? totalCredits / totalOrders : 0,
    };
}

/**
 * ✅ NEW: Format order for display
 */
export function formatOrderForDisplay(order: RazorpayOrderSummary): {
    displayId: string;
    displayDate: string;
    displayAmount: string;
    displayCredits: string;
    displayStatus: string;
    canGenerateInvoice: boolean;
} {
    return {
        displayId: order.orderId.slice(-8), // Show last 8 characters
        displayDate: new Date(order.orderCreatedAt).toLocaleDateString('en-IN'),
        displayAmount: formatCurrency(order.totalAmount),
        displayCredits: formatCredits(order.credits),
        displayStatus: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        canGenerateInvoice: order.invoiceEligible && order.gstCompliant,
    };
}

/**
 * ✅ NEW: Generate invoice data from order details
 */
export function generateInvoiceData(orderDetails: CompleteOrderDetails): {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    items: Array<{
        description: string;
        hsnCode: string;
        quantity: number;
        rate: number;
        amount: number;
    }>;
    taxBreakdown: {
        subtotal: number;
        cgst: number;
        sgst: number;
        igst: number;
        total: number;
    };
    customer: {
        name: string;
        email: string;
        gstin?: string;
        type: 'B2B' | 'B2C';
    };
    business: {
        name: string;
        gstin: string;
        address: string;
    };
} {
    const invoiceNumber = `INV-${orderDetails.orderId.slice(-8)}`;
    const invoiceDate = new Date(orderDetails.orderCreatedAt).toLocaleDateString('en-IN');
    const dueDate = invoiceDate; // Due immediately for digital services

    return {
        invoiceNumber,
        invoiceDate,
        dueDate,
        items: [
            {
                description: `Digital Credits - ${formatCredits(orderDetails.purchase.credits)}`,
                hsnCode: orderDetails.tax.hsnCode,
                quantity: orderDetails.purchase.credits,
                rate: parseFloat((orderDetails.purchase.baseAmount / orderDetails.purchase.credits).toFixed(4)),
                amount: orderDetails.purchase.baseAmount,
            },
        ],
        taxBreakdown: {
            subtotal: orderDetails.purchase.baseAmount,
            cgst: orderDetails.tax.breakdown.cgst,
            sgst: orderDetails.tax.breakdown.sgst,
            igst: orderDetails.tax.breakdown.igst,
            total: orderDetails.purchase.totalAmount,
        },
        customer: {
            name: orderDetails.customer.name,
            email: orderDetails.customer.email,
            gstin: orderDetails.customer.gstin ?? undefined,
            type: orderDetails.tax.customerType,
        },
        business: {
            name: "Your Company Name", // TODO: Get from config
            gstin: orderDetails.tax.businessGSTIN,
            address: "Your Business Address", // TODO: Get from config
        },
    };
}

/**
 * ✅ NEW: Check if order is eligible for invoice generation
 */
export function isOrderInvoiceEligible(order: RazorpayOrderSummary | CompleteOrderDetails): boolean {
    if ('invoiceEligible' in order) {
        return order.invoiceEligible && order.gstCompliant;
    }

    // For CompleteOrderDetails
    return order.invoiceReady && order.gstCompliant;
}

/**
 * ✅ NEW: Get orders by date range
 */
export async function getRazorpayOrdersByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number
): Promise<{ data: RazorpayOrdersResponse }> {
    const from = Math.floor(startDate.getTime() / 1000); // Convert to Unix timestamp
    const to = Math.floor(endDate.getTime() / 1000);

    return getRazorpayOrders({
        from,
        to,
        limit: limit || 50,
        status: 'paid'
    });
}

/**
 * ✅ NEW: Get orders for specific month
 */
export async function getRazorpayOrdersForMonth(
    year: number,
    month: number, // 0-based (0 = January)
    limit?: number
): Promise<{ data: RazorpayOrdersResponse }> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return getRazorpayOrdersByDateRange(startDate, endDate, limit);
}

/**
 * ✅ NEW: Search orders by receipt ID or order ID
 */
export async function searchRazorpayOrders(searchTerm: string): Promise<RazorpayOrderSummary[]> {
    const { data } = await getRazorpayOrders({ limit: 100 });

    return data.orders.filter(order =>
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.paymentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
}