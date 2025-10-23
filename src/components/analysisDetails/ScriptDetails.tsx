"use client";

import { Box, Alert } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useScriptDetails } from "@/hooks/scripts/useScriptDetails";
import { ScriptHeader } from "./header";
import { ScriptContentSection } from "./content";
import { ScriptAnalysisSection } from "./analysis";
import { ScriptFooter } from "./footer";
import { AnalysisStatus } from "./status";
import { LoadingState, ErrorState } from "./shared";
import { useScriptEdit } from "./hooks";
import logger from "@/utils/logger";

interface ScriptDetailsProps {
  scriptId?: string;
  versionId?: string;
}

/**
 * ScriptDetails - Main container for script analysis details
 *
 * Performance optimizations (React 19):
 * - Uses Suspense boundaries for progressive loading
 * - Implements proper error boundaries
 * - Optimized with React 19 compiler (no manual memo)
 *
 * Features:
 * - Header with back navigation
 * - Editable script content
 * - Analysis status and available analyses
 * - Analysis results display
 * - Footer with timestamps
 */
export default function ScriptDetails({
  scriptId: propScriptId,
  versionId: propVersionId,
}: ScriptDetailsProps) {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Use props if provided, otherwise fall back to URL params
  const scriptId = propScriptId || (params?.scriptId as string) || "";
  const versionId = propVersionId || (params?.versionId as string) || "";

  // Log IDs for debugging
  logger.debug("ScriptDetails - IDs", {
    scriptId,
    versionId,
    source: propScriptId ? "props" : "params",
  });

  // Data fetching
  const { details, isLoading, error } = useScriptDetails(scriptId, versionId);

  // Editing logic extracted to custom hook
  const {
    isEditing,
    editedContent,
    isUpdating,
    updateError,
    handleEdit,
    handleCancel,
    handleUpdate,
    handleContentChange,
  } = useScriptEdit({
    scriptId,
    versionId,
    initialContent: details?.version.content,
  });

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading script details..." />;
  }

  // Error state
  if (error || !details) {
    return <ErrorState error={error} onRetry={() => router.refresh()} />;
  }

  return (
    <Box
      sx={{
        py: 4,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Header Section */}
      <ScriptHeader details={details} />

      {/* Analysis Status Section */}
      <AnalysisStatus scriptId={scriptId} versionId={versionId} />

      {/* Content Section */}
      <ScriptContentSection
        content={details.version.content}
        isEditing={isEditing}
        isUpdating={isUpdating}
        editedContent={editedContent}
        updateError={updateError}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onUpdate={handleUpdate}
        onContentChange={handleContentChange}
      />

      {/* Analysis Results Section */}
      <ScriptAnalysisSection scriptId={scriptId} versionId={versionId} />

      {/* Footer Section */}
      <ScriptFooter
        createdAt={details.createdAt._seconds * 1000}
        modifiedAt={details.lastModifiedAt._seconds * 1000}
      />
    </Box>
  );
}
