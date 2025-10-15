//src/components/analysisLibrary/MyLibrary.tsx

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

  // ✅ Track the user ID that we've initialized with
  const initializedUserIdRef = useRef<string | undefined>(undefined);

  // ✅ FIX 1: Memoize saved script ID to prevent unnecessary reads
  const savedScriptId = useMemo(() => getSavedScriptId(), []);

  // ✅ FIX 2: Stable callback reference for script selection
  const handleScriptSelect = useCallback((script: Script | null) => {
    logger.debug("Script selected:", script?.scriptId || "none");
    setSelectedScript(script);
  }, []);

  // ✅ FIX 3: CRITICAL - Only reset on ACTUAL user change (different user ID)
  // This must check against the user ID we INITIALIZED with, not just previous value
  useEffect(() => {
    const currentUserId = user?.uid;

    // First time this component mounts with a user
    if (initializedUserIdRef.current === undefined && currentUserId) {
      logger.debug("MyLibrary initialized with user:", currentUserId);
      initializedUserIdRef.current = currentUserId;
      // Don't reset - let ProjectGrid do its job
      return;
    }

    // User changed (login/logout/switch)
    if (initializedUserIdRef.current !== currentUserId) {
      logger.debug(
        "User ID changed from",
        initializedUserIdRef.current,
        "to",
        currentUserId || "null"
      );
      logger.debug("Resetting selected script");

      initializedUserIdRef.current = currentUserId;
      setSelectedScript(null);
      saveSelectedScriptId(null);

      // Invalidate queries on user change
      queryClient.invalidateQueries({ queryKey: ["scriptDashboardAnalysis"] });
    }
    // Otherwise, it's just the user object updating (profile load, token refresh, etc) - ignore it
  }, [user?.uid, queryClient]);

  // Persist selected script
  useEffect(() => {
    if (selectedScript) {
      logger.debug("Persisting selected script:", selectedScript.scriptId);
      saveSelectedScriptId(selectedScript.scriptId);
    }
  }, [selectedScript]);

  const handleViewScript = useCallback(
    (script: Script): void => {
      if (!script?.scriptId || !script?.currentVersion) return;
      router.push(
        `/story/${script.scriptId}/version/${script.currentVersion}/0`
      );
    },
    [router]
  );

  const handleEditScript = useCallback(
    (script: Script): void => {
      if (!script?.scriptId || !script?.currentVersion) return;
      router.push(
        `/story/${script.scriptId}/version/${script.currentVersion}/3`
      );
    },
    [router]
  );

  const renderFeaturedProject = () => {
    // Show skeleton while no script is selected
    if (!selectedScript) {
      logger.debug("No script selected, showing skeleton");
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

    // Validate required fields
    if (!scriptId || !currentVersion) {
      logger.warn("Selected script missing required fields", {
        scriptId,
        currentVersion,
      });
      return <FeaturedProjectSkeleton />;
    }

    const createdTimestamp = createdAt?._seconds
      ? createdAt._seconds * 1000
      : Date.now();
    const modifiedTimestamp = lastModifiedAt?._seconds
      ? lastModifiedAt._seconds * 1000
      : Date.now();

    logger.debug("Rendering FeaturedProject for:", scriptId);

    return (
      <FeaturedProject
        key={`${scriptId}-${currentVersion}`}
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
        onScriptSelect={handleScriptSelect}
        savedScriptId={savedScriptId}
      />
    </Box>
  );
};

export default MyLibrary;
