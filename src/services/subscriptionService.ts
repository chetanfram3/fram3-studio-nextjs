import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface SubscriptionPlan {
    planId: string;
    amount: number;
    amountInPaisa: number;
    interval: string;
}

export interface SubscriptionPlans {
    [key: string]: {
        monthly: SubscriptionPlan;
        yearly: SubscriptionPlan;
    };
}

export interface CreateSubscriptionParams {
    subscriptionLevel: string;
    period: 'monthly' | 'yearly';
    currency?: string;
}

export interface VerifyPaymentParams {
    razorpay_subscription_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface CancelSubscriptionParams {
    reason?: string;
    cancelAtCycleEnd?: boolean;
}

export interface PauseResumeParams {
    pause_at?: 'now' | 'cycle_end';
    resume_at?: 'now' | 'cycle_end';
}

export interface UpdateSubscriptionParams {
    subscriptionLevel: string;
    period: 'monthly' | 'yearly';
    schedule_change_at?: 'now' | 'cycle_end';
    customer_notify?: 0 | 1;

}

export interface SubscriptionEntity {
    id: string;
    status: string;
    current_start: number;
    current_end: number;
    plan_id: string;
    cancellation?: {
        requestedAt: string;
        effectiveDate: string;
        cancelAtCycleEnd: boolean;
        reason?: string;
    };
}

export interface SubscriptionResponse {
    subscriptionEntity: SubscriptionEntity;
    subscriptionLevel: string;
    period: 'monthly' | 'yearly';
    currency: string;
    startDate: string;
    endDate: string;
}

async function getAuthToken(): Promise<string> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
        throw new Error('Authentication required');
    }
    return token;
}

export async function createSubscription(params: CreateSubscriptionParams) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/create-subscription`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to create subscription');
    }

    return response.json();
}

export async function verifyPayment(params: VerifyPaymentParams) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/verify-payment`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to verify payment');
    }

    return response.json();
}

export async function getCurrentSubscription(): Promise<{ data: SubscriptionResponse | { status: 'none' } }> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to fetch current subscription');
    }

    return response.json();
}

export async function cancelSubscription(params: CancelSubscriptionParams) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to cancel subscription');
    }

    return response.json();
}

export async function pauseSubscription(params: PauseResumeParams) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/pause`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to pause subscription');
    }

    return response.json();
}

export async function resumeSubscription(params: PauseResumeParams) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/resume`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to resume subscription');
    }

    return response.json();
}

export async function updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/update/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to update subscription');
    }
    await auth.currentUser?.getIdToken(true);
    return response.json();
}

export async function getSubscriptionHistory(limit: number = 10) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/history?limit=${limit}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to fetch subscription history');
    }

    return response.json();
}

export async function getPaymentHistory() {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/payments`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to fetch payment history');
    }

    return response.json();
}

export async function getInvoices(subscriptionId: string) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/invoices?subscription_id=${subscriptionId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to fetch invoices');
    }

    return response.json();
}

export async function getPlans() {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.description || errorData.error || 'Failed to fetch plans');
    }

    return response.json();
}