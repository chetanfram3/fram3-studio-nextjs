//src/components/analysisLibrary/MyLibrary.tsx

"use client";

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectHeader } from "./ProjectHeader";
import { ProjectGrid } from "./ProjectGrid";
import { FeaturedProject, FeaturedProjectSkeleton } from "./FeaturedProject";
import type { Script } from "@/types/scripts";
import { useAuthStore } from "@/store/authStore";
import logger from "@/utils/logger";

const saveSelectedScriptId = (scriptId: string | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (scriptId) {
      localStorage.setItem("selectedScriptId", scriptId);
    } else {
      localStorage.removeItem("selectedScriptId");
    }
  } catch (error) {
    logger.error("Error saving selected script ID:", error);
  }
};

const getSavedScriptId = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("selectedScriptId");
  } catch (error) {
    logger.error("Error reading selected script ID:", error);
    return null;
  }
};

const MyLibrary: React.FC = () => {
  const router = useRouter();
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Reset when user changes
  useEffect(() => {
    setSelectedScript(null);
    saveSelectedScriptId(null);
    return () => {
      queryClient.invalidateQueries({ queryKey: ["scriptDashboardAnalysis"] });
    };
  }, [user?.uid, queryClient]);

  // Persist selected script
  useEffect(() => {
    if (selectedScript) {
      saveSelectedScriptId(selectedScript.scriptId);
    }
  }, [selectedScript]);

  const handleViewScript = (script: Script): void => {
    if (!script?.scriptId || !script?.currentVersion) return;
    router.push(`/story/${script.scriptId}/version/${script.currentVersion}/0`);
  };

  const handleEditScript = (script: Script): void => {
    if (!script?.scriptId || !script?.currentVersion) return;
    router.push(`/story/${script.scriptId}/version/${script.currentVersion}/3`);
  };

  const renderFeaturedProject = () => {
    // ✅ SIMPLIFIED: Only check if script exists
    if (!selectedScript) {
      return <FeaturedProjectSkeleton />;
    }

    const {
      scriptTitle,
      brand,
      productCategory,
      versions,
      createdAt,
      lastModifiedAt,
      thumbnailPath,
      scriptId,
      currentVersion,
      favourite = false,
    } = selectedScript;

    if (!scriptId || !currentVersion) {
      return <FeaturedProjectSkeleton />;
    }

    const createdTimestamp = createdAt?._seconds
      ? createdAt._seconds * 1000
      : Date.now();
    const modifiedTimestamp = lastModifiedAt?._seconds
      ? lastModifiedAt._seconds * 1000
      : Date.now();

    return (
      <FeaturedProject
        title={scriptTitle || "Untitled Script"}
        brand={brand}
        productCategory={productCategory}
        version={`v${Array.isArray(versions) ? versions.length : 1}`}
        createdAt={createdTimestamp}
        lastModifiedAt={modifiedTimestamp}
        signedUrl={thumbnailPath || ""}
        scriptId={scriptId}
        versionId={currentVersion}
        favourite={favourite}
        onView={() => handleViewScript(selectedScript)}
        onEdit={() => handleEditScript(selectedScript)}
      />
    );
  };

  return (
    <Box sx={{ py: 4 }}>
      <ProjectHeader />
      {renderFeaturedProject()}
      <ProjectGrid
        selectedScript={selectedScript}
        onScriptSelect={setSelectedScript}
        savedScriptId={getSavedScriptId()}
      />
    </Box>
  );
};

export default MyLibrary;
