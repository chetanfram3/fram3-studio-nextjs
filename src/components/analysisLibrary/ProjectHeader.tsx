"use client";

import React from "react";
import { Box, Typography, Button, Tooltip } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useState, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import ScriptPullFrom from "@/components/common/ScriptPull";

interface ProjectHeaderProps {
  className?: string;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = React.memo(
  ({ className = undefined }) => {
    const theme = useTheme();
    const brand = getCurrentBrand();
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
    }, []);

    const handlePullError = useCallback((error: string): void => {
      console.error("Pull failed:", error);
    }, []);

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
        className={className}
        component="header"
        role="banner"
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              // ✅ FIXED: Use primary color (Gold in dark, Bronze in light)
              color: "primary.main",
              // ✅ FIXED: Use brand fonts
              fontFamily: brand.fonts.heading,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            PROJECTS
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
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
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{
                // ✅ FIXED: Use brand fonts
                fontFamily: brand.fonts.heading,
                fontSize: { xs: "0.8rem", md: "0.8rem" },
                fontWeight: 600,
                textTransform: "none",
                px: 2,
                height: 40,
                // Colors are handled by color="primary" which adapts to theme
              }}
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
