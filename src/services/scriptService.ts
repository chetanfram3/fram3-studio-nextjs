import { auth } from '@/lib/firebase';
import {
  ScriptUploadParams,
  ScriptAnalysisResponse,
  ScriptDetailsResponse,
  ScriptDetails,
  UpdateScriptVersionParams,
  UpdateScriptVersionResponse,
  ScriptAnalysisApiResponse,
  ScriptDashboardAnalysisApiResponse,
  ScriptsData,
  PreCheckError
} from '@/types';
import { Balance } from './payments';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface EditActorImagePromptParams {
  scriptId: string;
  versionId: string;
  actorId: number;
  actorVersionId: number;
  updatedPrompt: string;
}

export interface ActorPromptEditResponse {
  success: boolean;
  message: string;
  actorId: number;
  actorVersionId: number;
  updatedPrompt: string;
  originalBackedUp: boolean;
}

export interface ActorPromptHistoryParams {
  scriptId: string;
  versionId: string;
  actorId: number;
  actorVersionId: number;
}

export interface ActorPromptHistoryResponse {
  actorId: number;
  actorVersionId: number;
  currentPrompt: string | null;
  originalPrompt: string | null;
  hasBeenEdited: boolean;
  lastEditedAt: string | null;
}

// NEW: Location Image Prompt Types
export interface EditLocationImagePromptParams {
  scriptId: string;
  versionId: string;
  locationId: number;
  locationVersionId: number;
  updatedPrompt: string;
}

export interface LocationPromptEditResponse {
  success: boolean;
  message: string;
  locationId: number;
  locationVersionId: number;
  updatedPrompt: string;
  originalBackedUp: boolean;
}

export interface LocationPromptHistoryParams {
  scriptId: string;
  versionId: string;
  locationId: number;
  locationVersionId: number;
}

export interface LocationPromptHistoryResponse {
  locationId: number;
  locationVersionId: number;
  currentPrompt: string | null;
  originalPrompt: string | null;
  hasBeenEdited: boolean;
  lastEditedAt: string | null;
}

// Feedback Types
export interface FeedbackData {
  rating: number;
  comment: string;
  tags: string[];
  uploads: UploadData[];
}

export interface UploadData {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  uploadPath?: string;
}

export interface SubmitFeedbackParams {
  scriptId: string;
  versionId: string;
  page: 'overview' | 'market' | 'visuals' | 'editor';
  tab: string;
  feedbackData: FeedbackData;
  isFinalSubmission?: boolean;
}

export interface SubmitFeedbackResponse {
  success: boolean;
  message: string;
  data: {
    feedbackId: string;
    tabKey: string;
    overallProgress: {
      totalTabs: number;
      completedTabs: number;
      completionPercentage: number;
      status: 'not_started' | 'in_progress' | 'completed';
    };
    currentStatus: FeedbackStatus;
    finalSubmissionResult?: {
      success: boolean;
      feedbackId: string;
      submittedAt: string;
    } | null;
  };
}

export interface FeedbackStatus {
  exists: boolean;
  feedbackId?: string;
  pages: {
    overview: 'not_started' | 'partial' | 'completed';
    market: 'not_started' | 'partial' | 'completed';
    visuals: 'not_started' | 'partial' | 'completed';
    editor: 'not_started' | 'partial' | 'completed';
  };
  overallProgress: {
    totalTabs: number;
    completedTabs: number;
    completionPercentage: number;
    status: 'not_started' | 'in_progress' | 'completed';
  };
  pendingTabs: string[];
  completedTabs: string[];
  nextTab: string | null;
  lastActivity?: string;
}

export interface FeedbackStatsParams {
  scriptId: string;
  versionId: string;
  page?: 'overview' | 'market' | 'visuals' | 'editor';
  tab?: string;
  includeHistory?: boolean;
}

export interface TabFeedbackData {
  rating?: number;
  comment?: string;
  tags?: string[];
  uploads?: UploadData[];
  submittedAt?: string;
  [key: string]: unknown;
}

export interface PageStatusData {
  status: 'not_started' | 'partial' | 'completed';
  completedTabs: string[];
  totalTabs: number;
  lastUpdated: string | null;
}

export interface FeedbackSummary {
  hasFeedback: boolean;
  isComplete: boolean;
  completionPercentage: number;
  totalCompleted: number;
  totalTabs: number;
  lastActivity?: string;
}

export interface FeedbackHistoryItem {
  timestamp: string;
  page: string;
  tab: string;
  rating?: number;
  comment?: string;
  [key: string]: unknown;
}

export interface FeedbackStatsResponse {
  success: boolean;
  data: {
    type: 'overall' | 'page' | 'tab';
    exists: boolean;
    feedbackId?: string;
    page?: string;
    tab?: string;
    data?: TabFeedbackData;
    pages?: Record<string, 'not_started' | 'partial' | 'completed'>;
    overallProgress?: {
      totalTabs: number;
      completedTabs: number;
      completionPercentage: number;
      status: 'not_started' | 'in_progress' | 'completed';
    };
    pendingTabs?: string[];
    completedTabs?: string[];
    nextTab?: string | null;
    lastActivity?: string;
    summary?: FeedbackSummary;
    history?: FeedbackHistoryItem[];
    pageStatus?: PageStatusData;
    tabFeedback?: Record<string, TabFeedbackData>;
  };
}

export interface DeleteTabFeedbackParams {
  scriptId: string;
  versionId: string;
  page: 'overview' | 'market' | 'visuals' | 'editor';
  tab: string;
}

export interface DeleteTabFeedbackResponse {
  success: boolean;
  message: string;
  data?: {
    currentStatus: FeedbackStatus;
  };
}

export interface GeneratedScriptRow {
  id: string;
  scriptTitle: string;
  projectName: string;
  brandOrProductName: string;
  loglineConcept: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentVersion: number;
  targetDuration: number;
  mode: 'standard' | 'detailed' | 'fast';
  createdAt: string;
  lastModifiedAt: string;
  versionCount: number;
  hasMultipleVersions: boolean;
  analysisGenerated: boolean;
  analyzedVersions: Array<{
    versionNumber: number;
    analyzedAt: string;
    analyzedScriptId: string;
    analyzedVersionId: string;
  }>;
  latestAnalyzedVersion: number | null;
  versions?: Array<{
    versionNumber: number;
    scriptTitle: string;
    createdAt: string;
    modifiedBy: string;
    changeNotes: string;
    wordCount: number;
    narrativeWordCount: number;
    estimatedDuration: number | null;
    analysisGenerated: boolean;
    analyzedScriptId: string | null;
    analyzedVersionId: string | null;
    analyzedAt: string | null;
  }>;
  analysisDetails?: {
    hasAnalysis: boolean;
    totalAnalyzedVersions: number;
  };
}

export interface GeneratedScriptsListResponse {
  success: boolean;
  message: string;
  data: {
    rows: GeneratedScriptRow[];
    rowCount: number;
    pagination: {
      page: number;
      pageSize: number;
      totalPages: number;
    };
    legacyPagination: {
      currentPage: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    queryParams: {
      paginationModel: PaginationModel;
      sortModel: SortModel;
      filterModel: FilterModel;
      includeVersions: boolean;
      includeAnalysisDetails: boolean;
    };
  };
}

export interface PaginationModel {
  page: number;
  pageSize: number;
}

export interface SortModel {
  field: string;
  sort: 'asc' | 'desc';
}

export interface FilterModel {
  items: FilterItem[];
}

export interface FilterItem {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty' | 'isAnyOf';
  value?: unknown;
}

export interface GeneratedScriptsFilterOptions {
  projects: string[];
  brands: string[];
  statuses: ('pending' | 'processing' | 'completed' | 'failed')[];
  modes: ('standard' | 'detailed' | 'fast')[];
}

export interface GeneratedScriptsFilterOptionsResponse {
  success: boolean;
  message: string;
  data: GeneratedScriptsFilterOptions;
}

export interface GeneratedScriptsSummary {
  totalScripts: number;
  totalVersions: number;
  analyzedScripts: number;
  analyzedVersions: number;
  scriptsByStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  scriptsByProject: Record<string, number>;
  scriptsByBrand: Record<string, number>;
  scriptsByProduct: Record<string, number>;
  averageVersionsPerScript: string;
}

export interface GeneratedScriptsSummaryResponse {
  success: boolean;
  message: string;
  data: GeneratedScriptsSummary;
}

export interface FetchGeneratedScriptsParams {
  paginationModel?: PaginationModel;
  sortModel?: SortModel[];
  filterModel?: FilterModel;
  includeVersions?: boolean;
  includeAnalysisDetails?: boolean;
}

// Update the GeneratedScriptData interface in scriptService.ts
export interface GeneratedScriptData {
  genScriptId: string;
  currentVersion: number;
  scriptTitle: string;
  projectName: string;
  brandOrProductName: string;
  loglineConcept: string;
  status: string;
  targetDuration: number;
  createdAt: unknown;
  lastModifiedAt: unknown;
  disclaimer: string;
  versions: Array<{
    versionNumber: number;
    scriptAV: string;
    scriptNarrativeParagraph: string;
    scriptTitle: string;
    createdAt: string;
    modifiedBy: string;
    changeNotes: string;
    wordCount: number;
    narrativeWordCount: number;
    estimatedDuration: number;
  }>;
  analysisGenerated: boolean;
  analyzedVersion: number | null;
  analyzedScriptId: string | null;
  analyzedVersionId: string | null;
}

export interface GeneratedScriptDetailsData {
  genScriptId: string;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  status: string;
  targetDuration: number;
  createdAt: unknown;
  lastModifiedAt: unknown;
  mode: string;
  dialogueSettings: Record<string, unknown>;
  error: string | null;
}

export interface UpdateGeneratedScriptParams {
  genScriptId: string;
  scriptAV?: string;
  scriptTitle?: string;
  scriptNarrativeParagraph?: string;
  changeNotes?: string;
}

export interface ModelTierConfig {
  image: number;
  audio: number;
  video: number;
}

export interface AnalyzeGeneratedScriptParams {
  genScriptId: string;
  versionNumber: number;
  processingMode?: string;
  aspectRatio?: string;
  pauseBefore?: string[];
  forceNewScript?: boolean;
  modelTier?: ModelTierConfig;
  urls?: Array<{
    type: string;
    url: string;
    label?: string;
    customTypeLabel?: string;
  }>;
}

export interface FetchScriptsParams {
  pageSize?: number;
  pageNumber?: number;
  sortField?: string;
  sortOrder?: string;
  filterTitle?: string | null;
  isFavourite?: boolean | false;
}

export interface DeleteVersionParams {
  scriptId: string;
  versionId: string;
}

export interface DeleteVersionResponse {
  success: boolean;
  message: string;
}

export interface EditImagePromptParams {
  scriptId: string;
  versionId: string;
  sceneId: number;
  shotId: number;
  updatedPrompt: string;
}

export interface EditVideoPromptParams {
  scriptId: string;
  versionId: string;
  sceneId: number;
  shotId: number;
  updatedPrompt: string;
}

export interface PromptEditResponse {
  success: boolean;
  message: string;
  sceneId: number;
  shotId: number;
  updatedPrompt: string;
  originalBackedUp: boolean;
}

export interface PromptHistoryParams {
  scriptId: string;
  versionId: string;
  sceneId: number;
  shotId: number;
}

export interface PromptHistoryResponse {
  sceneId: number;
  shotId: number;
  currentPrompt: string | null;
  originalPrompt: string | null;
  hasBeenEdited: boolean;
  lastEditedAt: string | null;
}

export interface TokenAnalyticsParams {
  scriptId: string;
  versionId: string;
}

export interface TokenAnalyticsResponse {
  success: boolean;
  data: {
    userId: string;
    scriptId: string;
    versionId: string;
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    versionBreakdown: Record<string, {
      requests: number;
      totalTokens: number;
    }>;
    analysisTypeBreakdown: Record<string, {
      requests: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    }>;
    modelBreakdown: Record<string, {
      requests: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    }>;
    analysisModelMapping: Record<string, {
      analysisType: string;
      model: string;
      requests: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      location: string;
    }>;
    detailedAnalysisBreakdown: Record<string, {
      analysisType: string;
      totalRequests: number;
      totalTokens: number;
      modelUsage: Record<string, {
        requests: number;
        totalTokens: number;
        location: string;
      }>;
      averageTokensPerRequest: number;
    }>;
  };
}

export async function getAuthToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Authentication required');
  }
  return token;
}

/**
 * Parameters for fetching quick usage statistics
 */
export interface QuickUsageStatsParams {
  userId: string;
}

/**
 * Quick usage statistics response structure
 */
export interface QuickUsageStatsResponse {
  success: boolean;
  data: QuickStats;
}

/**
 * Recent activity item
 */
export interface RecentActivity {
  activity: string;
  timestamp: string;
  details: {
    usageType: string;
    credits: number;
    status: string;
  };
}

/**
 * Main Quick Stats data structure
 */
export interface QuickStats {
  creditsUsedToday: number;
  activeProjects: ActiveProjects;
  mediaGenerated14Days: MediaGenerated;
  averageDailyCredits: number;
  monthlyComparison: MonthlyComparison;
  projectedUsage: ProjectedUsage;
  recentActivity: RecentActivity[];
  generatedAt: string;
  balance: Balance;
  lastRechargeAmount: number;
  dataSource: 'unified_ledger' | 'unified_analytics' | 'cache';
}

/**
 * Active projects information
 */
export interface ActiveProjects {
  count: number;
  projects: ProjectSummary[];
}

/**
 * Individual project summary
 */
export interface ProjectSummary {
  scriptId: string;
  versionId: string;
  pipelineType: 'standard' | 'video';
  lastActivity: string;
  totalCredits: number;
  operationCount: number;
}

/**
 * Media generation statistics for last 14 days
 */
export interface MediaGenerated {
  total: number;
  breakdown: MediaBreakdown;
  details: MediaDetails;
}

/**
 * Breakdown of media types generated
 */
export interface MediaBreakdown {
  images: number;
  audio: number;
  video: number;
  imageEdits: number;
}

/**
 * Detailed statistics for each media type
 */
export interface MediaDetails {
  images: MediaTypeDetail;
  audio: MediaTypeDetail;
  video: MediaTypeDetail;
  imageEdits: MediaTypeDetail;
}

/**
 * Statistics for a specific media type
 */
export interface MediaTypeDetail {
  operations: number;
  credits: number;
}

/**
 * Monthly comparison statistics
 */
export interface MonthlyComparison {
  currentMonth: MonthlyPeriod;
  lastMonth: MonthlyPeriod;
  changePercent: number;
}

/**
 * Monthly period data
 */
export interface MonthlyPeriod {
  credits: number;
  period: TimePeriod;
}

/**
 * Time period definition
 */
export interface TimePeriod {
  start: string;
  end: string;
  label: string;
}

/**
 * Projected usage statistics
 */
export interface ProjectedUsage {
  currentUsage: number;
  dailyAverage: number;
  daysPassed: number;
  daysRemaining: number;
  projectedTotal: number;
  daysInMonth: number;
  vs_lastMonth: number;
}

/**
 * Parameters for fetching API call history
 */
export interface APICallHistoryParams {
  userId: string;
  days?: number;
  page?: number;
  limit?: number;
  usageCategory?: 'llm' | 'api' | 'credit_operation';
  status?: 'success' | 'failed' | 'partial';
  sortBy?: 'timestamp' | 'credits';
  sortOrder?: 'asc' | 'desc';
}

/**
 * API call history response structure
 */
export interface APICallHistoryResponse {
  success: boolean;
  data: APICallHistoryData;
}

/**
 * Main API call history data structure
 */
export interface APICallHistoryData {
  summary: APICallSummary;
  items: APIHistoryItem[];
  pagination: PaginationInfo;
  filters: APIHistoryFilters;
}

/**
 * Summary statistics for API calls
 */
export interface APICallSummary {
  totalAPICalls: number;
  creditsUsed: number;
  assetsGenerated: number;
  timeRange: {
    start: string;
    end: string;
    days: number;
  };
  successRate: number;
  breakdown: {
    byCategory: Record<string, CategoryBreakdown>;
    byStatus: Record<string, number>;
    byUsageType: Record<string, UsageTypeBreakdown>;
  };
}

/**
 * Individual API history item
 */
export interface APIHistoryItem {
  dateTime: string;
  usageType: string;
  analysisType?: string;
  usageCategory: 'llm' | 'api' | 'credit_operation';
  scriptId?: string;
  versionId?: string;
  pipelineType?: 'standard' | 'video';
  provider?: string;
  model?: string;
  apiCalls: number;
  creditsUsed: number;
  assetsGenerated: number;
  costUSD: number;
  status: 'success' | 'failed' | 'partial' | 'unknown';
  metadata: {
    requestId?: string;
    duration?: number;
    location?: string;
  };
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Active filters for API history
 */
export interface APIHistoryFilters {
  days: number;
  usageCategory?: string;
  status?: string;
  sortBy: string;
  sortOrder: string;
}

/**
 * Category breakdown statistics
 */
export interface CategoryBreakdown {
  count: number;
  credits: number;
  assets: number;
}

/**
 * Usage type breakdown statistics
 */
export interface UsageTypeBreakdown {
  count: number;
  credits: number;
  assets: number;
}

/**
 * Reusable API response handler with consistent error handling
 * @param response - Fetch response object
 * @param defaultErrorMessage - Default error message if none found in response
 * @returns Parsed response data
 * @throws Structured errors for credit issues, PreCheck failures, or generic errors
 */
async function handleApiResponse<T = unknown>(
  response: Response,
  defaultErrorMessage: string = 'API request failed'
): Promise<T> {
  const responseData = await response.json();

  if (!response.ok) {
    console.log('🔍 API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });

    // Check if this is a credit error (status 403 with INSUFFICIENT_CREDITS code)
    if (response.status === 402 && responseData.error?.code === 'INSUFFICIENT_CREDITS') {
      console.log('💰 Credit error detected, creating structured error');

      // Create an error that mimics axios structure for compatibility
      const creditError = new Error(responseData.error.message || 'Insufficient credits');
      (creditError as Error & { response?: { status: number; data: unknown } }).response = {
        status: response.status,
        data: responseData
      };
      throw creditError;
    }

    // Check if this is a PreCheck failure
    if (responseData.message === "PreChecks failed" && responseData.analysisResults?.preCheck) {
      const recommendation = responseData.analysisResults.preCheck.recommendation ||
        'Script could not be classified. Please check the content and try again.';
      throw new PreCheckError("PreChecks failed", recommendation);
    }

    // Handle other HTTP error codes with specific messages
    const errorMessage = responseData.error?.message ||
      responseData.error ||
      responseData.message ||
      defaultErrorMessage;

    throw new Error(errorMessage);
  }

  return responseData;
}

export async function triggerPipeline(scriptId: string, versionId: string) {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/pipeline-run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId,
      versionId,
      userId: auth.currentUser?.uid
    })
  });

  return handleApiResponse(response, 'Failed to trigger pipeline');
}

export async function setFavourite(scriptId: string, isFavourite: boolean) {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/set-favourite`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId,
      userId: auth.currentUser?.uid,
      isFavourite
    })
  });

  return handleApiResponse(response, 'Failed to set favourite');
}

export async function analyzeScript(params: ScriptUploadParams): Promise<ScriptAnalysisResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/presampling`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  return handleApiResponse<ScriptAnalysisResponse>(response, 'Failed to analyze script');
}

export async function fetchAllScripts(params: FetchScriptsParams): Promise<{ data: ScriptsData }> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams({
    pageSize: params.pageSize?.toString() || "10",
    pageNumber: params.pageNumber?.toString() || "1",
    sortField: params.sortField || "createdAt",
    sortOrder: params.sortOrder || "desc",
    ...(params.filterTitle ? { filterTitle: params.filterTitle } : {}),
    ...(params.isFavourite !== undefined ? { isFavourite: params.isFavourite.toString() } : {}),
  }).toString();

  const response = await fetch(`${API_BASE_URL}/scripts/all-scripts?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleApiResponse<{ data: ScriptsData }>(response, 'Failed to fetch scripts');
}

export async function fetchScriptDetails(scriptId: string, versionId: string): Promise<ScriptDetails> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/scripts/get-script?scriptId=${scriptId}&versionId=${versionId}&includeDetails=true`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await handleApiResponse<ScriptDetailsResponse>(response, 'Failed to fetch script details');
  return data.data.script;
}

export async function updateScriptVersion(params: UpdateScriptVersionParams): Promise<UpdateScriptVersionResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/add-version`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  return handleApiResponse<UpdateScriptVersionResponse>(response, 'Failed to update script version');
}

export async function fetchScriptAnalysis(
  scriptId: string,
  versionId: string,
  analysisType: string
): Promise<ScriptAnalysisApiResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/scripts/get-analysis?scriptId=${scriptId}&versionId=${versionId}&analysisType=${analysisType}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return handleApiResponse<ScriptAnalysisApiResponse>(response, 'Failed to fetch script analysis');
}

export async function fetchScriptDashboardAnalysis(
  scriptId: string,
  versionId: string,
  dashboardAnalysisType: string
): Promise<ScriptDashboardAnalysisApiResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/scripts/get-dashboard-analysis?scriptId=${scriptId}&versionId=${versionId}&dashboardAnalysisType=${dashboardAnalysisType}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return handleApiResponse<ScriptDashboardAnalysisApiResponse>(response, 'Failed to fetch script analysis');
}

export async function deleteScriptVersion(params: DeleteVersionParams): Promise<DeleteVersionResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/delete-version`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: auth.currentUser?.uid,
      ...params
    })
  });

  return handleApiResponse<DeleteVersionResponse>(response, 'Failed to delete script version');
}

/**
 * Edit an image prompt for a specific scene and shot
 */
export async function editImagePrompt(params: EditImagePromptParams): Promise<PromptEditResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/images/edit-image-prompt`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: auth.currentUser?.uid,
      ...params
    })
  });

  return handleApiResponse<PromptEditResponse>(response, 'Failed to edit image prompt');
}

/**
 * Edit a video prompt for a specific scene and shot
 */
export async function editVideoPrompt(params: EditVideoPromptParams): Promise<PromptEditResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/images/edit-video-prompt`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: auth.currentUser?.uid,
      ...params
    })
  });

  return handleApiResponse<PromptEditResponse>(response, 'Failed to edit video prompt');
}

/**
 * Get image prompt history (current and original)
 */
export async function getImagePromptHistory(params: PromptHistoryParams): Promise<PromptHistoryResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams({
    scriptId: params.scriptId,
    versionId: params.versionId,
    sceneId: params.sceneId.toString(),
    shotId: params.shotId.toString()
  }).toString();

  const response = await fetch(`${API_BASE_URL}/images/get-image-prompt-history?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return handleApiResponse<PromptHistoryResponse>(response, 'Failed to fetch image prompt history');
}

/**
 * Get video prompt history (current and original)
 */
export async function getVideoPromptHistory(params: PromptHistoryParams): Promise<PromptHistoryResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams({
    scriptId: params.scriptId,
    versionId: params.versionId,
    sceneId: params.sceneId.toString(),
    shotId: params.shotId.toString()
  }).toString();

  const response = await fetch(`${API_BASE_URL}/images/get-video-prompt-history?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return handleApiResponse<PromptHistoryResponse>(response, 'Failed to fetch video prompt history');
}

/**
 * Fetch token analytics for a specific script and version
 */
export async function fetchTokenAnalytics(params: TokenAnalyticsParams): Promise<TokenAnalyticsResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/usage-analytics/script/${params.scriptId}/stats?versionId=${params.versionId}&userId=${auth.currentUser?.uid}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return handleApiResponse<TokenAnalyticsResponse>(response, 'Failed to fetch token analytics');
}

/**
 * Fetch a generated script with version details
 */
export async function fetchGeneratedScript(genScriptId: string): Promise<GeneratedScriptData> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/scripts/get-generated-script?genScriptId=${genScriptId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await handleApiResponse<{ data: GeneratedScriptData }>(response, 'Failed to fetch generated script');
  return data.data;
}

/**
 * Fetch generated script details including input and output data
 */
export async function fetchGeneratedScriptDetails(genScriptId: string): Promise<GeneratedScriptDetailsData> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/scripts/get-generated-script-details?genScriptId=${genScriptId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const data = await handleApiResponse<{ data: GeneratedScriptDetailsData }>(response, 'Failed to fetch generated script details');
  return data.data;
}

/**
 * Update a generated script version
 */
export async function updateGeneratedScript(params: UpdateGeneratedScriptParams): Promise<{ success: boolean; versionNumber: number }> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/update-generated-script`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  return handleApiResponse(response, 'Failed to update generated script');
}

/**
 * Trigger analysis for a generated script
 */
export async function analyzeGeneratedScript(params: AnalyzeGeneratedScriptParams): Promise<{
  success: boolean;
  scriptId: string;
  versionId: string;
  taskId?: string;
  jobId?: string;
}> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/analyze-generated-script`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  return handleApiResponse(response, 'Failed to analyze generated script');
}

/**
 * Fetch all generated scripts with MUI Data Grid compatible pagination
 */
export async function fetchAllGeneratedScripts(params: FetchGeneratedScriptsParams): Promise<GeneratedScriptsListResponse> {
  const token = await getAuthToken();

  // Default values
  const paginationModel = params.paginationModel || { page: 0, pageSize: 10 };
  const sortModel = params.sortModel || [{ field: 'createdAt', sort: 'desc' }];
  const filterModel = params.filterModel || { items: [] };

  const queryParams = new URLSearchParams({
    paginationModel: JSON.stringify(paginationModel),
    sortModel: JSON.stringify(sortModel),
    filterModel: JSON.stringify(filterModel),
    includeVersions: (params.includeVersions || false).toString(),
    includeAnalysisDetails: (params.includeAnalysisDetails || false).toString(),
  });

  const response = await fetch(`${API_BASE_URL}/scripts/get-all-generated-scripts?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return handleApiResponse<GeneratedScriptsListResponse>(response, 'Failed to fetch generated scripts');
}

/**
 * Fetch filter options for generated scripts
 */
export async function fetchGeneratedScriptsFilterOptions(): Promise<GeneratedScriptsFilterOptionsResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/get-generated-scripts-filter-options`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return handleApiResponse<GeneratedScriptsFilterOptionsResponse>(response, 'Failed to fetch filter options');
}

/**
 * Fetch summary statistics for generated scripts
 */
export async function fetchGeneratedScriptsSummary(): Promise<GeneratedScriptsSummaryResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/get-generated-scripts-summary`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return handleApiResponse<GeneratedScriptsSummaryResponse>(response, 'Failed to fetch summary statistics');
}

/**
 * Fetch quick usage statistics for a user
 */
export async function fetchQuickUsageStats(params: QuickUsageStatsParams): Promise<QuickUsageStatsResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/usage-analytics/user/${params.userId}/quickstats`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return handleApiResponse<QuickUsageStatsResponse>(response, 'Failed to fetch quick usage statistics');
}

/**
 * Submit feedback for a specific tab
 */
export async function submitFeedback(params: SubmitFeedbackParams): Promise<SubmitFeedbackResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/submit-feedback`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  return handleApiResponse<SubmitFeedbackResponse>(response, 'Failed to submit feedback');
}

/**
 * Get feedback statistics and status
 */
export async function getFeedbackStats(params: FeedbackStatsParams): Promise<FeedbackStatsResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams({
    scriptId: params.scriptId,
    versionId: params.versionId,
    ...(params.page && { page: params.page }),
    ...(params.tab && { tab: params.tab }),
    ...(params.includeHistory !== undefined && { includeHistory: params.includeHistory.toString() })
  });

  const response = await fetch(`${API_BASE_URL}/scripts/get-feedback-stats?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return handleApiResponse<FeedbackStatsResponse>(response, 'Failed to get feedback stats');
}

/**
 * Delete feedback for a specific tab
 */
export async function deleteTabFeedback(params: DeleteTabFeedbackParams): Promise<DeleteTabFeedbackResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/scripts/delete-tab-feedback`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  return handleApiResponse<DeleteTabFeedbackResponse>(response, 'Failed to delete tab feedback');
}

/**
 * Edit an image prompt for a specific actor
 */
export async function editActorImagePrompt(params: EditActorImagePromptParams): Promise<ActorPromptEditResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/images/edit-actor-image-prompt`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: auth.currentUser?.uid,
      ...params
    })
  });

  return handleApiResponse<ActorPromptEditResponse>(response, 'Failed to edit actor image prompt');
}

/**
 * Get actor image prompt history (current and original)
 */
export async function getActorImagePromptHistory(params: ActorPromptHistoryParams): Promise<ActorPromptHistoryResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams({
    scriptId: params.scriptId,
    versionId: params.versionId,
    actorId: params.actorId.toString(),
    actorVersionId: params.actorVersionId.toString()
  }).toString();

  const response = await fetch(`${API_BASE_URL}/images/actor-image-prompt-history?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await handleApiResponse<{ data: ActorPromptHistoryResponse }>(response, 'Failed to fetch actor image prompt history');
  return data.data; // Extract data from the success response wrapper
}

/**
 * Edit an image prompt for a specific location
 */
export async function editLocationImagePrompt(params: EditLocationImagePromptParams): Promise<LocationPromptEditResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/images/edit-location-image-prompt`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: auth.currentUser?.uid,
      ...params
    })
  });

  return handleApiResponse<LocationPromptEditResponse>(response, 'Failed to edit location image prompt');
}

/**
 * Get location image prompt history (current and original)
 */
export async function getLocationImagePromptHistory(params: LocationPromptHistoryParams): Promise<LocationPromptHistoryResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams({
    scriptId: params.scriptId,
    versionId: params.versionId,
    locationId: params.locationId.toString(),
    locationVersionId: params.locationVersionId.toString()
  }).toString();

  const response = await fetch(`${API_BASE_URL}/images/location-image-prompt-history?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await handleApiResponse<{ data: LocationPromptHistoryResponse }>(response, 'Failed to fetch location image prompt history');
  return data.data; // Extract data from the success response wrapper
}

/**
 * Fetch API call history with usage analytics
 */
export async function fetchAPICallHistory(params: APICallHistoryParams): Promise<APICallHistoryResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams();

  // Add all parameters to query string
  if (params.days !== undefined) queryParams.append('days', params.days.toString());
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params.usageCategory) queryParams.append('usageCategory', params.usageCategory);
  if (params.status) queryParams.append('status', params.status);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const response = await fetch(
    `${API_BASE_URL}/usage-analytics/user/${params.userId}/api-history?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return handleApiResponse<APICallHistoryResponse>(response, 'Failed to fetch API call history');
}