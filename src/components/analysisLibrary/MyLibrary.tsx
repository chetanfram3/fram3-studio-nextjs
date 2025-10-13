// src/components/analysisLibrary/MyLibrary.tsx
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

// ===========================
// MAIN COMPONENT
// ===========================

const MyLibrary: React.FC = () => {
  const router = useRouter();
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Reset cache and selected script when user changes
  useEffect(() => {
    logger.debug("MyLibrary: User changed, resetting selected script");
    // Clear selected script when user changes
    setSelectedScript(null);

    // Cleanup function to invalidate queries when component unmounts
    return () => {
      queryClient.invalidateQueries({
        queryKey: ["scriptDashboardAnalysis"],
      });
    };
  }, [user?.uid, queryClient]); // FIXED: Removed selectedScript from dependencies

  const handleViewScript = (script: Script): void => {
    if (!script?.scriptId || !script?.currentVersion) {
      logger.error("MyLibrary: Invalid script data for viewing");
      return;
    }
    router.push(
      `/story/${script.scriptId}/version/${script.currentVersion}/0`
    );
  };

  const handleEditScript = (script: Script): void => {
    if (!script?.scriptId || !script?.currentVersion) {
      logger.error("MyLibrary: Invalid script data for editing");
      return;
    }
    router.push(
      `/story/${script.scriptId}/version/${script.currentVersion}/3`
    );
  };

  const renderFeaturedProject = () => {
    // Show skeleton while waiting for script selection
    if (!selectedScript) {
      logger.debug("MyLibrary: No selected script, showing skeleton");
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

    // Validate required properties
    if (!scriptId || !currentVersion) {
      logger.error("MyLibrary: Missing required script properties", {
        scriptId,
        currentVersion,
      });
      return <FeaturedProjectSkeleton />;
    }

    // Safe timestamp conversion
    const createdTimestamp = createdAt?._seconds
      ? createdAt._seconds * 1000
      : Date.now();
    const modifiedTimestamp = lastModifiedAt?._seconds
      ? lastModifiedAt._seconds * 1000
      : Date.now();

    logger.debug("MyLibrary: Rendering FeaturedProject", {
      scriptId,
      currentVersion,
      thumbnailPath,
    });

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
      />
    </Box>
  );
};

export default MyLibrary;
