// src/components/analysisDetails/types.ts

import type { ScriptDetails as BaseScriptDetails } from "@/types";
import type { AnalysisType } from "@/config/analysisTypes";

/**
 * Core component prop types
 */
export interface ScriptDetailsProps {
  scriptId?: string;
  versionId?: string;
}

export interface ScriptHeaderProps {
  details: BaseScriptDetails;
}

export interface ScriptContentSectionProps {
  content: string;
  isEditing: boolean;
  isUpdating: boolean;
  editedContent: string;
  updateError: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: () => void;
  onContentChange: (content: string) => void;
}

export interface ScriptContentProps {
  content: string;
  onEdit: () => void;
}

export interface ScriptEditorProps {
  content: string;
  isUpdating: boolean;
  onCancel: () => void;
  onUpdate: () => void;
  onContentChange: (content: string) => void;
}

export interface ScriptAnalysisSectionProps {
  scriptId: string;
  versionId: string;
}

export interface ScriptFooterProps {
  createdAt: number;
  modifiedAt: number;
}

/**
 * Analysis-related types
 */
export interface AnalysisStatusProps {
  scriptId: string;
  versionId: string;
}

export interface AvailableAnalysisProps {
  scriptId: string;
  versionId: string;
  completedAnalyses: AnalysisType[];
  onAnalysisClick: (analysisType: AnalysisType) => void;
}

export interface AnalysisCardProps {
  analysisType: AnalysisType;
  scriptId: string;
  versionId: string;
}

/**
 * Shared component types
 */
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