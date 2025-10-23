// src/components/analysisDetails/shared/types.ts

export interface LoadingStateProps {
  message?: string;
}

export interface ErrorStateProps {
  error: string | Error | null;
  onRetry?: () => void;
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}