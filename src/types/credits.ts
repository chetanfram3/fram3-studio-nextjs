export interface CreditError {
  code: string;
  message: string;
  details: {
    required: number;
    available: number;
    shortfall: number;
    percentageAvailable: string;
    suggestion: string;
    recommendedPackage: {
      recommended: string;
      reason: string;
      price: number;
      credits: number;
      bonus: number;
    };
  };
  scriptId?: string;
  versionId?: string;
  route?: string;
  note?: string;
}

export interface CreditErrorResponse {
  error: CreditError;
  status: number;
  scriptId: string;
  versionId: string;
  route: string;
  note: string;
}

// types/index.ts - Add these types to your existing types file

export interface TaskCreditError {
  message: string;
  details: {
    required: number;
    available: number;
    shortfall: number;
    percentageAvailable: string;
    recommendedPackage: {
      recommended: string;
      reason: string;
      price: number;
      credits: number;
      bonus: number;
    };
  };
}

// Extended resume response type that can include credit errors
export interface ResumeTaskResponse {
  success?: boolean;
  message?: string;
  taskId?: string;
  jobId?: string;
  checkpointId?: string;
  resumeType?: 'simple' | 'checkpoint';
  isPromotingExistingJob?: boolean;
  resumeDetails?: {
    analysesToResume?: string[];
    analysesCount?: number;
    availablePausedAnalyses?: string[];
    completedBeforeResume?: number;
    currentPauseBefore?: string[];
    existingJobReused?: boolean;
  };
  creditInfo?: {
    reservationId?: string;
    isNewReservation?: boolean;
    totalReserved?: number;
    additionalReserved?: number;
  };
  enhancedResume?: boolean;
  
  // Configuration needed response
  canResume?: boolean;
  reason?: string;
  availablePausedAnalyses?: string[];
  currentPauseBefore?: string[];
  suggestion?: string;
  actionRequired?: string;
  resumeInfo?: {
    totalCompleted: number;
    totalPaused: number;
    pausedAnalyses: string[];
    canResumeByUnpausing: boolean;
  };
  
  // Credit error properties
  error?: string;
  errorType?: string;
  details?: CreditError['details'];
  required?: number;
  available?: number;
  shortfall?: number;
  resumeContext?: {
    taskId: string;
    scriptId: string;
    versionId: string;
    route: string;
    reservationId?: string;
    totalNeededForResume?: number;
  };
  note?: string;
}

// HTTP Error response that can contain credit error data
export interface HttpErrorResponse extends Error {
  response?: {
    status: number;
    statusText: string;
    data: ResumeTaskResponse | CreditErrorResponse | unknown;
  };
}