// src/components/common/ImpersonationBanner.tsx
"use client";

import { Box, Alert, Button, Typography, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SecurityIcon from "@mui/icons-material/Security";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import PersonIcon from "@mui/icons-material/Person";
import { getCurrentBrand } from "@/config/brandConfig";
import { useImpersonation } from "@/hooks/useImpersonation";

/**
 * ImpersonationBanner Component
 *
 * Displays a sticky warning banner when an admin is impersonating another user.
 * Shows the target user's email and provides a button to stop impersonation.
 * Only visible when actively impersonating.
 */
export function ImpersonationBanner() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isImpersonating, currentUser, stopImpersonatingUser } =
    useImpersonation();

  // Don't render anything if not impersonating
  if (!isImpersonating) {
    return null;
  }

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonatingUser();
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
    }
  };

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        p: 2,
        bgcolor: "background.default",
        borderBottom: `2px solid ${theme.palette.warning.main}`,
      }}
    >
      <Alert
        severity="warning"
        icon={<SecurityIcon />}
        sx={{
          maxWidth: "1200px",
          width: "100%",
          borderRadius: `${brand.borderRadius}px`,
          // Use primary color for border emphasis
          border: `2px solid ${theme.palette.warning.main}`,
          bgcolor: theme.palette.warning.light,
          "& .MuiAlert-message": {
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          },
        }}
        action={
          <Button
            color="inherit"
            size="small"
            variant="contained"
            onClick={handleStopImpersonation}
            startIcon={<StopCircleIcon />}
            sx={{
              bgcolor: "warning.dark",
              color: "warning.contrastText",
              fontWeight: 600,
              borderRadius: `${brand.borderRadius}px`,
              "&:hover": {
                bgcolor: "error.main",
              },
            }}
          >
            Stop Impersonating
          </Button>
        }
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              icon={<SecurityIcon />}
              label="IMPERSONATING"
              size="small"
              sx={{
                bgcolor: "error.main",
                color: "error.contrastText",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            />
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ color: "text.primary", fontSize: 20 }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Currently viewing as:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "warning.dark",
                fontFamily: brand.fonts.body,
              }}
            >
              {currentUser?.email || "Unknown User"}
            </Typography>
          </Box>

          {currentUser?.displayName && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontStyle: "italic",
              }}
            >
              ({currentUser.displayName})
            </Typography>
          )}
        </Box>
      </Alert>
    </Box>
  );
}

// Default export for backward compatibility
export default ImpersonationBanner;
