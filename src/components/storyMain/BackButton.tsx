"use client";

import { Tooltip, IconButton, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { getCurrentBrand } from "@/config/brandConfig";
import type { SxProps, Theme } from "@mui/material";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface BackButtonProps {
  sx?: SxProps<Theme>;
  homePath?: string;
  showHomeButton?: boolean;
}

// ===========================
// MAIN COMPONENT
// ===========================

export function BackButton({
  sx,
  homePath = "/dashboard/my-scripts",
  showHomeButton = true,
}: BackButtonProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  const handleHomeClick = () => {
    router.push(homePath);
  };

  const handleBackClick = () => {
    router.back();
  };

  // Shared button styles using theme
  const buttonStyles: SxProps<Theme> = {
    border: 2,
    borderColor: "primary.main",
    borderRadius: `${brand.borderRadius}px`,
    p: 1,
    transition: theme.transitions.create(
      ["background-color", "border-color", "transform"],
      { duration: theme.transitions.duration.short }
    ),
    "&:hover": {
      bgcolor: "action.hover",
      borderColor: "primary.dark",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      {showHomeButton && (
        <Tooltip title="Go to Home" arrow>
          <IconButton
            size="small"
            color="primary"
            onClick={handleHomeClick}
            sx={{
              ...buttonStyles,
              ...sx,
            }}
            aria-label="Go to home"
          >
            <HomeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Go Back" arrow>
        <IconButton
          size="small"
          color="primary"
          onClick={handleBackClick}
          sx={buttonStyles}
          aria-label="Go back"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default BackButton;
