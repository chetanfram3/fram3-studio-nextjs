// src/components/analysisDetails/hooks/types.ts


import type { AnalysisType } from "@/config/analysisTypes";

export interface UseScriptEditOptions {
  scriptId: string;
  versionId: string;
  initialContent?: string;
}

export interface UseScriptEditReturn {
  isEditing: boolean;
  editedContent: string;
  isUpdating: boolean;
  updateError: string | null;
  handleEdit: () => void;
  handleCancel: () => void;
  handleUpdate: () => Promise<void>;
  handleContentChange: (content: string) => void;
}

export interface UseAnalysisNavigationOptions {
  scriptId: string;
  versionId: string;
}

export interface UseAnalysisNavigationReturn {
  navigateToAnalysis: (analysisType: AnalysisType) => void;  // ← Changed from string to AnalysisType
  isNavigating: boolean;
}