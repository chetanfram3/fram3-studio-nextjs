"use client";

import { useState } from "react";
import { Box, Paper, Alert } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useScriptDetails } from "@/hooks/scripts/useScriptDetails";
import { useScriptMutation } from "@/hooks/scripts/useScriptMutation";
import ScriptHeader from "./ScriptHeader";
import ScriptContent from "./ScriptContent";
import ScriptFooter from "./ScriptFooter";
import ScriptAnalysis from "./ScriptAnalysis";
import AnalysisStatus from "./status/AnalysisStatus";

interface ScriptDetailsProps {
  scriptId?: string;
  versionId?: string;
}

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

  // Debug: Log the IDs being used
  console.log("📄 ScriptDetails IDs:", {
    scriptId,
    versionId,
    propScriptId,
    propVersionId,
    paramsScriptId: params?.scriptId,
    paramsVersionId: params?.versionId,
  });

  const { details, isLoading, error } = useScriptDetails(scriptId, versionId);
  const { updateScript, isUpdating, error: updateError } = useScriptMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  const handleEdit = () => {
    setEditedContent(details?.version.content || "");
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!scriptId || !editedContent.trim()) return;

    updateScript(
      {
        scriptId,
        scriptContent: editedContent,
      },
      {
        onSuccess: (data) => {
          setIsEditing(false);
          // Navigate to the new version
          router.push(
            `/dashboard/scripts/${scriptId}/version/${data.versionId}`
          );
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert
          severity="info"
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            borderRadius: `${brand.borderRadius}px`,
            borderLeft: 4,
            borderColor: "primary.main",
          }}
        >
          Loading script details...
        </Alert>
      </Box>
    );
  }

  if (error || !details) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            borderRadius: `${brand.borderRadius}px`,
            borderLeft: 4,
            borderColor: "error.main",
          }}
        >
          {typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : "Failed to load script details"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      {/* Header */}
      <ScriptHeader details={details} />
      <AnalysisStatus scriptId={scriptId} versionId={versionId} />

      {/* Content */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 1,
          borderTop: 4,
          borderColor: "primary.main",
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          transition: theme.transitions.create(["box-shadow", "border-color"], {
            duration: theme.transitions.duration.standard,
          }),
          "&:hover": {
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <ScriptContent
          content={details.version.content}
          isEditing={isEditing}
          isUpdating={isUpdating}
          editedContent={editedContent}
          updateError={updateError}
          onEdit={handleEdit}
          onCancel={() => setIsEditing(false)}
          onUpdate={handleUpdate}
          onContentChange={setEditedContent}
        />
      </Paper>

      {/* Analysis */}
      <ScriptAnalysis scriptId={scriptId} versionId={versionId} />

      {/* Footer */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          transition: theme.transitions.create(["box-shadow"], {
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <ScriptFooter
          createdAt={details.createdAt._seconds * 1000}
          modifiedAt={details.lastModifiedAt._seconds * 1000}
        />
      </Paper>
    </Box>
  );
}
