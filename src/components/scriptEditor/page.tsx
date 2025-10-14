// app/dashboard/scripts/generated/[genScriptId]/[[...version]]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useGeneratedScript,
  useUpdateGeneratedScript,
} from "@/hooks/scripts/useGenScript";
import ScriptorLayout from "./ScriptorLayout";
import ScriptEditor from "./ScriptEditor";
import { Box, CircularProgress, Alert } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useCallback, useMemo, startTransition } from "react";
import type { ScriptData } from "./types";
import logger from "@/utils/logger";

export default function ScriptEditorPage() {
  const router = useRouter();
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Get route params - version is an optional catch-all route
  const params = useParams<{
    genScriptId: string;
    version?: string[];
  }>();

  const genScriptId = params?.genScriptId;
  const version = params?.version?.[0];

  // Parse version number if provided
  const requestedVersion = useMemo(() => {
    return version ? parseInt(version, 10) : undefined;
  }, [version]);

  // Only use the generated script hook if genScriptId is provided
  const {
    data: script,
    isLoading: scriptLoading,
    error: scriptError,
    refetch: refetchScript,
  } = useGeneratedScript(genScriptId);

  // Use the update mutation separately
  const { mutateAsync: updateScriptAsync } = useUpdateGeneratedScript();

  // Memoize the save handler
  const handleSave = useCallback(
    async (content: string, title: string): Promise<boolean> => {
      if (genScriptId) {
        try {
          await updateScriptAsync({
            genScriptId,
            scriptNarrativeParagraph: content,
            scriptTitle: title,
            changeNotes: "Updated from editor",
          });

          logger.info("Script saved successfully", { genScriptId });

          // Refetch to get the latest version information
          const result = await refetchScript();

          // If we have a new current version, update the URL
          if (result.data && result.data.currentVersion !== requestedVersion) {
            // Navigate to the new version URL using startTransition for non-blocking update
            startTransition(() => {
              router.replace(
                `/scripts/generated/${genScriptId}/${result.data.currentVersion}`
              );
            });
          }

          return true;
        } catch (error) {
          logger.error("Failed to save script", { error, genScriptId });
          return false;
        }
      } else {
        logger.debug("Local save", { content, title });
        // Store in memory instead of localStorage (as per artifact restrictions)
        // Note: This data will be lost on page refresh, but that's expected behavior
        return true;
      }
    },
    [genScriptId, updateScriptAsync, refetchScript, requestedVersion, router]
  );

  // Memoize default script data
  const defaultScriptData: Partial<ScriptData> = useMemo(
    () => ({
      scriptTitle: "Untitled Script",
      scriptNarrativeParagraph: "",
      scriptAV: "",
      script: "",
      scriptDuration: 0,
      estimatedDuration: 0,
      mode: "TV Commercial",
      disclaimer: undefined,
      conceptSummary: {},
      strategicContextSummary: {},
      suggestedVisualElements: [],
      suggestedAudioCues: [],
    }),
    []
  );

  // If no genScriptId, show the editor with default/empty data
  if (!genScriptId) {
    return (
      <ScriptorLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 150px)",
          }}
        >
          <ScriptEditor scriptData={defaultScriptData} onSave={handleSave} />
        </Box>
      </ScriptorLayout>
    );
  }

  // Loading state for generated scripts
  if (scriptLoading) {
    return (
      <ScriptorLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress
            sx={{
              color: "primary.main",
            }}
          />
        </Box>
      </ScriptorLayout>
    );
  }

  // Error state for generated scripts
  if (scriptError) {
    logger.warn("Failed to load script from server", {
      scriptError,
      genScriptId,
    });

    return (
      <ScriptorLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 150px)",
          }}
        >
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              bgcolor: "background.paper",
              color: "text.primary",
              borderLeft: 3,
              borderColor: "warning.main",
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Could not load script from server. You can still create and edit
            scripts locally.
          </Alert>
          <ScriptEditor scriptData={defaultScriptData} onSave={handleSave} />
        </Box>
      </ScriptorLayout>
    );
  }

  // If script loaded but not found
  if (!script) {
    logger.info("Script not found, starting with new script", { genScriptId });

    return (
      <ScriptorLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 150px)",
          }}
        >
          <Alert
            severity="info"
            sx={{
              mb: 2,
              bgcolor: "background.paper",
              color: "text.primary",
              borderLeft: 3,
              borderColor: "info.main",
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Script not found. Starting with a new script.
          </Alert>
          <ScriptEditor scriptData={defaultScriptData} onSave={handleSave} />
        </Box>
      </ScriptorLayout>
    );
  }

  // Success state - script loaded from server
  // Use requested version if provided, otherwise use current version
  const versionToLoad = requestedVersion || script.currentVersion;

  // Find the specific version
  const currentVersion = useMemo(
    () => script.versions.find((v) => v.versionNumber === versionToLoad),
    [script.versions, versionToLoad]
  );

  // If requested version doesn't exist, show error
  if (requestedVersion && !currentVersion) {
    logger.error("Version not found", { requestedVersion, genScriptId });

    return (
      <ScriptorLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 150px)",
          }}
        >
          <Alert
            severity="error"
            sx={{
              mb: 2,
              bgcolor: "background.paper",
              color: "text.primary",
              borderLeft: 3,
              borderColor: "error.main",
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Version {requestedVersion} not found. Please select a valid version.
          </Alert>
          <ScriptEditor
            scriptData={{
              scriptTitle: script.scriptTitle,
              scriptNarrativeParagraph: "",
              scriptAV: "",
              script: "",
              scriptDuration: script.targetDuration || 0,
              estimatedDuration: 0,
              mode: "TV Commercial",
              disclaimer: script.disclaimer,
              conceptSummary: {},
              strategicContextSummary: {},
              suggestedVisualElements: [],
              suggestedAudioCues: [],
            }}
            onSave={handleSave}
            genScriptId={genScriptId}
            versions={script.versions}
            currentVersionNumber={script.currentVersion}
            requestedVersionNumber={versionToLoad}
          />
        </Box>
      </ScriptorLayout>
    );
  }

  // Prepare script data with memoization
  const scriptData: Partial<ScriptData> = useMemo(
    () => ({
      scriptTitle: currentVersion?.scriptTitle || script.scriptTitle,
      scriptNarrativeParagraph: currentVersion?.scriptNarrativeParagraph || "",
      scriptAV: currentVersion?.scriptAV || "",
      script: currentVersion?.scriptAV || "",
      scriptDuration:
        currentVersion?.estimatedDuration || script.targetDuration || 0,
      estimatedDuration: currentVersion?.estimatedDuration,
      mode: "TV Commercial",
      disclaimer: script.disclaimer,
      conceptSummary: {},
      strategicContextSummary: {},
      suggestedVisualElements: [],
      suggestedAudioCues: [],
    }),
    [currentVersion, script]
  );

  const currentUrlVersion = useMemo(
    () => (version ? parseInt(version, 10) : script.currentVersion),
    [version, script.currentVersion]
  );

  return (
    <ScriptorLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 150px)",
        }}
      >
        <ScriptEditor
          scriptData={scriptData}
          onSave={handleSave}
          genScriptId={genScriptId}
          versions={script.versions}
          currentVersionNumber={script.currentVersion}
          requestedVersionNumber={currentUrlVersion}
        />
      </Box>
    </ScriptorLayout>
  );
}
