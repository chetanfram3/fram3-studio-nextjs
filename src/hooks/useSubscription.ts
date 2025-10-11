import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentSubscription,
  createSubscription,
  verifyPayment,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  updateSubscription,
  getSubscriptionHistory,
  getPaymentHistory,
  getInvoices,
  getPlans,
  type CreateSubscriptionParams,
  type VerifyPaymentParams,
  type CancelSubscriptionParams,
  type PauseResumeParams,
  type UpdateSubscriptionParams,
  type SubscriptionResponse
} from '@/services/subscriptionService';


// Query key factory
const subscriptionKeys = {
  all: ['subscription'] as const,
  current: () => [...subscriptionKeys.all, 'current'] as const,
  history: () => [...subscriptionKeys.all, 'history'] as const,
  payments: () => [...subscriptionKeys.all, 'payments'] as const,
  invoices: (subscriptionId: string) => [...subscriptionKeys.all, 'invoices', subscriptionId] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
};

// Hook for getting current subscription
export function useCurrentSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: getCurrentSubscription,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2,
  });
}

// Hook for creating a new subscription
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSubscription,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
    },
  });
}

// Hook for verifying payment
export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyPayment,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.payments() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.history() });
    },
  });
}

// Hook for canceling subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.history() });
    },
  });
}

// Hook for pausing subscription
export function usePauseSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.history() });
    },
  });
}

// Hook for resuming subscription
export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.history() });
    },
  });
}

// Hook for updating subscription
export function useUpdateSubscription(subscriptionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateSubscriptionParams) =>
      updateSubscription(subscriptionId, params),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.payments() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.history() });
    },
  });
}

// Hook for getting subscription history
export function useSubscriptionHistory(limit: number = 10) {
  return useQuery({
    queryKey: [...subscriptionKeys.history(), limit],
    queryFn: () => getSubscriptionHistory(limit),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
}

// Hook for getting payment history
export function usePaymentHistory() {
  return useQuery({
    queryKey: subscriptionKeys.payments(),
    queryFn: getPaymentHistory,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook for getting subscription invoices
export function useSubscriptionInvoices(subscriptionId: string) {
  return useQuery({
    queryKey: subscriptionKeys.invoices(subscriptionId),
    queryFn: () => getInvoices(subscriptionId),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(subscriptionId),
  });
}

// Hook for getting available plans
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: getPlans,
    staleTime: 1000 * 60 * 30, // Consider plans fresh for 30 minutes
  });
}

// Utility hook for checking if a subscription can be modified
export function useCanModifySubscription() {
  const { data: currentSubscription } = useCurrentSubscription();

  const subscription = currentSubscription?.data as SubscriptionResponse;

  const canModify = Boolean(
    subscription &&
    subscription.subscriptionEntity &&
    subscription.subscriptionEntity.status === 'active' &&
    !subscription.subscriptionEntity.cancellation
  );

  return {
    canModify,
    subscription,
    status: subscription?.subscriptionEntity?.status,
    hasCancellation: Boolean(subscription?.subscriptionEntity?.cancellation),
  };
}