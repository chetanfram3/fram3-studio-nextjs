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
    // Clear selected script when user changes
    setSelectedScript(null);

    // Return cleanup function to invalidate queries when component unmounts or user changes
    return () => {
      if (selectedScript) {
        queryClient.invalidateQueries({
          queryKey: ["scriptDashboardAnalysis"],
        });
      }
    };
  }, [user?.uid, queryClient, selectedScript]);

  const handleViewScript = (script: Script): void => {
    if (!script?.scriptId || !script?.currentVersion) {
      console.error("Invalid script data for viewing");
      return;
    }
    router.push(
      `/dashboard/story/${script.scriptId}/version/${script.currentVersion}/0`
    );
  };

  const handleEditScript = (script: Script): void => {
    if (!script?.scriptId || !script?.currentVersion) {
      console.error("Invalid script data for editing");
      return;
    }
    router.push(
      `/dashboard/story/${script.scriptId}/version/${script.currentVersion}/3`
    );
  };

  const renderFeaturedProject = () => {
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
      favourite = false, // Safe default for optional property
    } = selectedScript;

    // Ensure required properties exist
    if (!scriptId || !currentVersion || !versions) {
      console.error("Missing required script properties");
      return <FeaturedProjectSkeleton />;
    }

    // Safe timestamp conversion
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
      />
    </Box>
  );
};

export default MyLibrary;
