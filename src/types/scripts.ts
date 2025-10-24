import { GridValidRowModel } from '@mui/x-data-grid';
import { AnalysisData } from './analysis';
import type { ProcessingMode, AspectRatio, ModelTierConfig } from '@/components/common/ProcessingModeSelector';

export interface Script extends GridValidRowModel {
  id: string; // Required by GridValidRowModel
  scriptId: string;
  scriptTitle: string;
  title: string;
  description: string;
  version: Version;
  scriptDescription: string;
  currentVersion: string;
  favourite?: boolean;
  versions: {
    versionId: string;
    versionNumber: number;
    createdAt: { _seconds: number };
    lastModifiedAt: { _seconds: number };
  }[];
  createdAt: { _seconds: number };
  lastModifiedAt: { _seconds: number };
}


// Existing types can remain unchanged
export interface UpdateScriptVersionParams {
  scriptId: string;
  scriptContent: string;
}

export interface UpdateScriptVersionResponse {
  message: string;
  versionId: string;
}

export interface Analysis {
  analysisId: string;
  analysisType: string; // e.g., "sentiment", "engagement", etc.
}

export interface Version {
  versionId: string;
  versionNumber: number;
  content: string;
  analyses: Analysis[];
  createdAt: { _seconds: number };
  lastModifiedAt: { _seconds: number };
}

export interface ScriptDetails {
  scriptId: string;
  title: string;
  description: string;
  version: Version;
  createdAt: { _seconds: number };
  lastModifiedAt: { _seconds: number };
}


export interface ScriptAnalysisParams {
  scriptId: string; // ID of the script to analyze
  versionId: string; // Version ID of the script
  content: string; // Full content of the script to be analyzed
  analysisType: string; // The type of analysis to perform (e.g., "moderation", "categories", etc.
}

export interface ScriptUploadParams {
  title: string; // Title of the script
  description: string; // Description of the script
  script: string; // Full content of the script to be analyzed
  scriptId: string; // Unique Firestore ID for the script
  versionId: string; // Unique Firestore ID for the script version
  processingMode?: ProcessingMode;
  aspectRatio?: AspectRatio;
  pauseBefore?: string[];
  modelTier?: ModelTierConfig;
  urls?: Array<{
    type: string;
    url: string;
    label?: string;
    customTypeLabel?: string;
  }>;
}

export interface ScriptsData {
  scripts: Script[]; // Array of scripts
}

export interface ScriptsResponse {
  message: string; // Message from the API
  data: ScriptsData; // Data containing scripts
}

export interface ScriptData {
  script: Script; // The script details
}

export interface ScriptDetailsResponse {
  message: string; // Message from the API
  data: ScriptData; // Data containing the script details
}

export interface UsageMetadata {
  promptTokenCount: number; // Number of tokens in the prompt
  candidatesTokenCount: number; // Number of tokens in the candidates
  totalTokenCount: number; // Total number of tokens
}

export interface AnalysisItem {
  id: string; // Analysis ID
  analysisType: string;
  usageMetadata: UsageMetadata; // Metadata about token usage
  modelVersion: string; // Model version used for the analysis
  data: AnalysisData; // Analysis data
  streamed: boolean; // Whether the analysis was streamed
  status: string; // Status of the analysis (e.g., "completed")
  timestamp: {
    _seconds: number; // Seconds part of the timestamp
    _nanoseconds: number; // Nanoseconds part of the timestamp
  };
}

export interface ScriptAnalysisApiResponse {
  message: string; // Response message
  analyses: AnalysisItem[]; // Array of analysis items
}

export interface ScriptDashboardAnalysisApiResponse {
  message: string;
  data: {}; // eslint-disable-line @typescript-eslint/no-empty-object-type
}

export interface DeleteVersionParams {
  scriptId: string;
  versionId: string;
}

export interface DeleteVersionResponse {
  success: boolean;
  message: string;
}

export interface PaginationData {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  lastScript: string;
  sortField: string;
  sortOrder: string;
  isFavourite: boolean;
  allCount?: number;
}

export interface ScriptsData {
  scripts: Script[]; // Array of scripts
  pagination: PaginationData; // Pagination details
}