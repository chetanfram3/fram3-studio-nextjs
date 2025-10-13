"use client";

import { Typography, Grid } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScriptCard, SkeletonCard } from "./ScriptCard";
import VersionsDialog from "./VersionsDialog";
import type { Script } from "@/types/scripts";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface GridListProps {
  scripts: Script[];
  isLoading: boolean;
  selectedScript: Script | null;
  onScriptSelect: (script: Script) => void;
  pageSize: number;
}

// ===========================
// MAIN COMPONENT
// ===========================

export function GridList({
  scripts,
  isLoading,
  selectedScript,
  onScriptSelect,
  pageSize,
}: GridListProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogScript, setDialogScript] = useState<Script | null>(null);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogScript(null);
  };

  const handleInfoClick = (script: Script) => {
    setDialogScript(script);
    setDialogOpen(true);
  };

  // Loading state - show skeleton cards
  if (isLoading) {
    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {[...Array(pageSize)].map((_, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <SkeletonCard />
          </Grid>
        ))}
      </Grid>
    );
  }

  // Empty state
  if (scripts.length === 0) {
    return (
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mt: 2, textAlign: "center" }}
      >
        No scripts available.
      </Typography>
    );
  }

  // Main render - script grid
  return (
    <>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {scripts.map((script) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={script.scriptId}>
            <ScriptCard
              script={script}
              isSelected={selectedScript?.scriptId === script.scriptId}
              onSelect={() => onScriptSelect(script)}
              onViewDetails={() =>
                router.push(
                  `/story/${script.scriptId}/version/${script.currentVersion}`
                )
              }
              onInfoClick={() => handleInfoClick(script)}
            />
          </Grid>
        ))}
      </Grid>

      {dialogScript && (
        <VersionsDialog
          open={dialogOpen}
          script={dialogScript}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
