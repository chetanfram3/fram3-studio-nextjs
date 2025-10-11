"use client";

import React from "react";
import { Box, Typography, Button, Tooltip } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useState, useCallback } from "react";
import type { SxProps, Theme } from "@mui/material";
// Fix the import - use default import and correct path
import ScriptPullFrom from "@/components/common/ScriptPull";

interface ProjectHeaderProps {
  className?: string;
}

interface StyleProps {
  header: SxProps<Theme>;
  titleContainer: SxProps<Theme>;
  titleText: SxProps<Theme>;
  button: SxProps<Theme>;
  actionsContainer: SxProps<Theme>;
}

// Styles defined outside component to prevent re-creation
const styles: StyleProps = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 4,
  },
  titleContainer: {
    display: "flex",
    alignItems: "center",
    gap: 1,
  },
  titleText: {
    color: "secondary.main",
    fontFamily: "'Orbitron', sans-serif",
    fontSize: { xs: "1.25rem", md: "1.5rem" },
    fontWeight: 700,
    letterSpacing: "0.05em",
  },
  button: {
    bgcolor: "secondary.main",
    fontFamily: "'Orbitron', sans-serif",
    fontSize: { xs: "0.8rem", md: "0.8rem" },
    fontWeight: 600,
    color: "secondary.contrastText",
    "&:hover": {
      bgcolor: "secondary.dark",
    },
    textTransform: "none",
    px: 2,
    height: 40,
  },
  actionsContainer: {
    display: "flex",
    alignItems: "center",
    gap: 2,
  },
};

export const ProjectHeader: React.FC<ProjectHeaderProps> = React.memo(
  ({
    className = undefined, // Default value provided here instead of defaultProps
  }) => {
    const [analysisDialogOpen, setAnalysisDialogOpen] =
      useState<boolean>(false);

    const handleOpenDialog = useCallback((): void => {
      setAnalysisDialogOpen(true);
    }, []);

    const handleCloseDialog = useCallback((): void => {
      setAnalysisDialogOpen(false);
    }, []);

    const handlePullComplete = useCallback((result: any): void => {
      console.log("Script pulled successfully:", result);
      // Navigation is now handled inside the ScriptPullFrom component
      // You can add any additional logic here if needed
    }, []);

    const handlePullError = useCallback((error: string): void => {
      console.error("Pull failed:", error);
      // You might want to show a toast notification here
      // CustomToast("error", error);
    }, []);

    return (
      <Box
        sx={styles.header}
        className={className}
        component="header"
        role="banner"
      >
        <Box sx={styles.titleContainer}>
          <Typography variant="h2" sx={styles.titleText} component="h1">
            PROJECTS
          </Typography>
        </Box>

        <Box sx={styles.actionsContainer}>
          <ScriptPullFrom
            onComplete={handlePullComplete}
            onError={handlePullError}
            variant="contained"
            size="medium"
          />

          <Tooltip
            title="Upload a new script for analysis"
            placement="top"
            arrow
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={styles.button}
              aria-label="Upload new script for analysis"
            >
              Analysis
            </Button>
          </Tooltip>
        </Box>
      </Box>
    );
  }
);

ProjectHeader.displayName = "ProjectHeader";

export default ProjectHeader;
