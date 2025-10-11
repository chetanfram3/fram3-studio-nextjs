'use client';

// hooks/useInvoices.ts - Comprehensive Invoices Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useMemo } from 'react';
import logger from '@/utils/logger';
import {
    fetchInvoices,
    fetchInvoiceDetails,
    fetchInvoiceStats,
    cancelInvoice,
    downloadInvoice,
    FetchInvoicesParams,
    FetchInvoiceStatsParams,
    CancelInvoiceParams,
    Invoice,
    InvoiceListItem,
    InvoiceStats,
    formatInvoiceStatus,
    formatPaymentMethod,
    formatCurrency,
    formatDate,
    getInvoiceAge,
    isInvoiceOverdue,
    getPaymentMethodIcon,
    getUPIProvider
} from '@/services/invoiceService';

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Invoice filter options interface
 */
interface InvoiceFilters {
    status?: 'paid' | 'pending' | 'failed' | 'cancelled' | 'refunded';
    sort?: string;
    limit?: number;
    page?: number;
}

// ===========================
// INVOICES LIST HOOK
// ===========================

/**
 * Hook for managing invoices list with pagination and filtering
 * @param params - Query parameters for fetching invoices
 * @returns Invoice list data and utility functions
 */
export function useInvoices(params: FetchInvoicesParams = {}) {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    // Memoize query parameters for stable reference
    const queryParams = useMemo(() => ({
        status: params.status,
        limit: params.limit || 25,
        page: params.page || 1,
        orderBy: params.orderBy || 'createdAt',
        orderDirection: params.orderDirection || 'desc',
    }), [params.status, params.limit, params.page, params.orderBy, params.orderDirection]);

    // Clear cache when user changes
    useEffect(() => {
        return () => {
            if (!user) {
                logger.debug('User logged out, clearing invoices cache');
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
            }
        };
    }, [user?.uid, queryClient]);

    const query = useQuery({
        queryKey: [
            'invoices',
            user?.uid,
            queryParams.status,
            queryParams.limit,
            queryParams.page,
            queryParams.orderBy,
            queryParams.orderDirection
        ],
        queryFn: async () => {
            logger.debug('Fetching invoices', {
                userId: user?.uid,
                page: queryParams.page,
                limit: queryParams.limit,
                status: queryParams.status
            });

            const response = await fetchInvoices(queryParams);

            logger.debug('Invoices fetched successfully', {
                count: response.invoices.length,
                total: response.pagination.total
            });

            return response;
        },
        enabled: Boolean(user?.uid),
        staleTime: 1000 * 60 * 2, // 2 minutes
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        gcTime: 1000 * 60 * 10, // 10 minutes
    });

    return {
        ...query,

        // Data accessors
        invoices: query.data?.invoices || [],
        pagination: query.data?.pagination || {
            page: 1,
            limit: queryParams.limit,
            total: 0,
            hasMore: false,
        },

        // Current parameters
        currentParams: queryParams,

        // Utility functions
        formatInvoiceForDisplay: (invoice: InvoiceListItem) => ({
            ...invoice,
            formattedStatus: formatInvoiceStatus(invoice.status),
            formattedAmount: formatCurrency(invoice.amount, invoice.currency),
            formattedDate: formatDate(invoice.createdAt),
            formattedPaidDate: invoice.paidAt ? formatDate(invoice.paidAt) : null,
            formattedDueDate: formatDate(invoice.dueDate),
            age: getInvoiceAge(invoice.createdAt),
            paymentMethodIcon: getPaymentMethodIcon(invoice.paymentMethod),
        }),

        // Refresh function
        refresh: () => query.refetch(),
    };
}

// ===========================
// SINGLE INVOICE HOOK
// ===========================

/**
 * Hook for fetching detailed invoice information
 * @param invoiceId - Invoice identifier
 * @returns Detailed invoice data and utility functions
 */
export function useInvoiceDetails(invoiceId: string) {
    const { user } = useAuthStore();

    const query = useQuery({
        queryKey: ['invoice', invoiceId, user?.uid],
        queryFn: async () => {
            logger.debug('Fetching invoice details', { invoiceId, userId: user?.uid });

            const response = await fetchInvoiceDetails(invoiceId);

            logger.debug('Invoice details fetched successfully', {
                invoiceId,
                status: response.invoice.status
            });

            return response;
        },
        enabled: Boolean(invoiceId && user?.uid),
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });

    return {
        ...query,

        // Data accessors
        invoice: query.data?.invoice,

        // Enhanced invoice data with formatting
        enhancedInvoice: query.data?.invoice ? {
            ...query.data.invoice,
            formattedStatus: formatInvoiceStatus(query.data.invoice.status),
            formattedPaymentMethod: formatPaymentMethod(query.data.invoice),
            formattedAmount: formatCurrency(query.data.invoice.amounts.total, query.data.invoice.amounts.currency),
            formattedBaseAmount: formatCurrency(query.data.invoice.amounts.base, query.data.invoice.amounts.currency),
            formattedGSTAmount: formatCurrency(query.data.invoice.amounts.gst, query.data.invoice.amounts.currency),
            formattedCreatedDate: formatDate(query.data.invoice.createdAt),
            formattedPaidDate: query.data.invoice.paidAt ? formatDate(query.data.invoice.paidAt) : null,
            formattedDueDate: formatDate(query.data.invoice.dueDate),
            age: getInvoiceAge(query.data.invoice.createdAt),
            isOverdue: isInvoiceOverdue(query.data.invoice),
            paymentMethodIcon: getPaymentMethodIcon(query.data.invoice.payment.method_type),
            upiProvider: query.data.invoice.payment.upi?.vpa ? getUPIProvider(query.data.invoice.payment.upi.vpa) : null,
        } : null,

        // Utility functions
        canCancel: () => {
            return query.data?.invoice?.status === 'pending';
        },

        canDownload: () => {
            return query.data?.invoice?.status === 'paid';
        },

        getTransactionReference: () => {
            const invoice = query.data?.invoice;
            if (!invoice) return null;

            const payment = invoice.payment;
            switch (payment.method_type) {
                case 'upi':
                    return payment.upi?.transaction_id || payment.acquirer_data?.rrn;
                case 'card':
                    return payment.acquirer_data?.auth_code || invoice.razorpayPaymentId;
                case 'netbanking':
                    return payment.netbanking?.bank_transaction_id;
                case 'wallet':
                    return payment.wallet?.wallet_transaction_id;
                case 'emi':
                    return payment.emi?.auth_code || invoice.razorpayPaymentId;
                default:
                    return invoice.razorpayPaymentId;
            }
        },
    };
}

// ===========================
// INVOICE STATISTICS HOOK
// ===========================

/**
 * Hook for fetching invoice statistics
 * @param params - Query parameters for statistics
 * @returns Invoice statistics with enhanced formatting
 */
export function useInvoiceStats(params: FetchInvoiceStatsParams = {}) {
    const { user } = useAuthStore();

    const queryParams = useMemo(() => ({
        startDate: params.startDate,
        endDate: params.endDate,
    }), [params.startDate, params.endDate]);

    const query = useQuery({
        queryKey: ['invoiceStats', user?.uid, queryParams.startDate, queryParams.endDate],
        queryFn: async () => {
            logger.debug('Fetching invoice statistics', {
                userId: user?.uid,
                startDate: queryParams.startDate,
                endDate: queryParams.endDate
            });

            const response = await fetchInvoiceStats(queryParams);

            logger.debug('Invoice statistics fetched successfully', {
                total: response.stats.total,
                paid: response.stats.paid
            });

            return response;
        },
        enabled: Boolean(user?.uid),
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2,
        refetchOnWindowFocus: false,
    });

    return {
        ...query,

        // Data accessors
        stats: query.data?.stats,

        // Enhanced stats with formatting
        enhancedStats: query.data?.stats ? {
            ...query.data.stats,
            formattedTotalAmount: formatCurrency(query.data.stats.totalAmount),
            formattedPaidAmount: formatCurrency(query.data.stats.paidAmount),
            paidPercentage: query.data.stats.total > 0 ?
                Math.round((query.data.stats.paid / query.data.stats.total) * 100) : 0,
            successRate: query.data.stats.total > 0 ?
                Math.round((query.data.stats.paid / query.data.stats.total) * 100) : 0,
            averageInvoiceAmount: query.data.stats.total > 0 ?
                query.data.stats.totalAmount / query.data.stats.total : 0,
            averagePaidAmount: query.data.stats.paid > 0 ?
                query.data.stats.paidAmount / query.data.stats.paid : 0,
            topPaymentMethod: Object.entries(query.data.stats.paymentMethods)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None',
            paymentMethodBreakdown: Object.entries(query.data.stats.paymentMethods)
                .map(([method, count]) => ({
                    method,
                    count,
                    percentage: query.data.stats.paid > 0 ? Math.round((count / query.data.stats.paid) * 100) : 0
                }))
                .sort((a, b) => b.count - a.count),
        } : null,
    };
}

// ===========================
// INVOICE ACTIONS HOOKS
// ===========================

/**
 * Hook for cancelling an invoice
 * @returns Mutation for cancelling invoices
 */
export function useCancelInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: CancelInvoiceParams) => {
            logger.info('Cancelling invoice', { invoiceId: params.invoiceId });

            const response = await cancelInvoice(params);

            logger.info('Invoice cancelled successfully', { invoiceId: params.invoiceId });

            return response;
        },
        onSuccess: (data, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
            queryClient.invalidateQueries({ queryKey: ['invoiceStats'] });
        },
        onError: (error, variables) => {
            logger.error('Failed to cancel invoice', {
                invoiceId: variables.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        },
    });
}

/**
 * Hook for downloading an invoice
 * @returns Mutation for downloading invoices
 */
export function useDownloadInvoice() {
    return useMutation({
        mutationFn: async (invoiceId: string) => {
            logger.info('Downloading invoice', { invoiceId });

            const response = await downloadInvoice(invoiceId);

            logger.info('Invoice download response received', { invoiceId });

            return response;
        },
        onSuccess: (data, invoiceId) => {
            if (data.invoiceData) {
                logger.debug('Invoice data ready for PDF generation', { invoiceId });
            }
        },
        onError: (error, invoiceId) => {
            logger.error('Failed to download invoice', {
                invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        },
    });
}

// ===========================
// COMBINED DASHBOARD HOOK
// ===========================

/**
 * Combined hook for invoice dashboard with all data
 * @param params - Parameters for both invoices and stats queries
 * @returns Combined invoice dashboard data
 */
export function useInvoiceDashboard(params: {
    invoicesParams?: FetchInvoicesParams;
    statsParams?: FetchInvoiceStatsParams;
} = {}) {
    const invoicesQuery = useInvoices(params.invoicesParams);
    const statsQuery = useInvoiceStats(params.statsParams);

    return {
        // Individual queries
        invoices: invoicesQuery,
        stats: statsQuery,

        // Combined loading state
        isLoading: invoicesQuery.isLoading || statsQuery.isLoading,
        isError: invoicesQuery.isError || statsQuery.isError,
        error: invoicesQuery.error || statsQuery.error,

        // Combined data
        hasData: Boolean(invoicesQuery.data || statsQuery.data),

        // Refresh all data
        refreshAll: () => {
            invoicesQuery.refresh();
            statsQuery.refetch();
        },

        // Quick stats for dashboard cards
        quickStats: statsQuery.enhancedStats ? {
            totalInvoices: statsQuery.enhancedStats.total,
            totalRevenue: statsQuery.enhancedStats.formattedTotalAmount,
            successRate: `${statsQuery.enhancedStats.successRate}%`,
            topPaymentMethod: statsQuery.enhancedStats.topPaymentMethod,
            pendingInvoices: statsQuery.enhancedStats.pending,
            paidInvoices: statsQuery.enhancedStats.paid,
            failedInvoices: statsQuery.enhancedStats.failed,
        } : null,
    };
}

// ===========================
// UTILITY HOOKS
// ===========================

/**
 * Hook for invoice filtering and sorting
 * Provides filter options and helper functions
 * @returns Filter options and utility functions
 */
export function useInvoiceFilters() {
    const statusOptions = [
        { value: 'paid' as const, label: 'Paid', color: 'success' },
        { value: 'pending' as const, label: 'Pending', color: 'warning' },
        { value: 'failed' as const, label: 'Failed', color: 'error' },
        { value: 'cancelled' as const, label: 'Cancelled', color: 'default' },
        { value: 'refunded' as const, label: 'Refunded', color: 'info' },
    ];

    const sortOptions = [
        { value: 'createdAt-desc', label: 'Newest First', orderBy: 'createdAt' as const, orderDirection: 'desc' as const },
        { value: 'createdAt-asc', label: 'Oldest First', orderBy: 'createdAt' as const, orderDirection: 'asc' as const },
        { value: 'amount-desc', label: 'Highest Amount', orderBy: 'amount' as const, orderDirection: 'desc' as const },
        { value: 'amount-asc', label: 'Lowest Amount', orderBy: 'amount' as const, orderDirection: 'asc' as const },
        { value: 'dueDate-asc', label: 'Due Date', orderBy: 'dueDate' as const, orderDirection: 'asc' as const },
    ];

    const limitOptions = [
        { value: 10, label: '10 per page' },
        { value: 25, label: '25 per page' },
        { value: 50, label: '50 per page' },
        { value: 100, label: '100 per page' },
    ];

    return {
        statusOptions,
        sortOptions,
        limitOptions,

        /**
         * Build query params from filter selections
         * @param filters - Filter values selected by user
         * @returns Formatted parameters for fetchInvoices
         */
        buildParams: (filters: InvoiceFilters): FetchInvoicesParams => {
            const sortOption = sortOptions.find(opt => opt.value === filters.sort);

            return {
                status: filters.status,
                limit: filters.limit,
                page: filters.page,
                orderBy: sortOption?.orderBy,
                orderDirection: sortOption?.orderDirection,
            };
        },
    };
}

// ===========================
// EXPORT TYPES
// ===========================

export type { InvoiceFilters };