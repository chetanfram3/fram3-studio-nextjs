"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Typography,
  Box,
  Alert,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  VisibilityOutlined as ViewIcon,
  DeleteOutlineOutlined as DeleteIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { useVersionDelete } from "@/hooks/useVersionDelete";
import DeleteVersionDialog from "./DeleteVersionDialog";
import CustomToast from "@/components/common/CustomToast";
import type { Script } from "@/types/scripts";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface VersionsDialogProps {
  open: boolean;
  script: Script | null;
  onClose: () => void;
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Format a Firestore timestamp (seconds since epoch) to a readable date string
 */
const formatDate = (seconds: number): string => {
  const date = new Date(seconds * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ===========================
// MAIN COMPONENT
// ===========================

export default function VersionsDialog({
  open,
  script,
  onClose,
}: VersionsDialogProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();
  const router = useRouter();

  const [deleteVersion, setDeleteVersion] = useState<{
    versionId: string;
    versionNumber: number;
  } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { handleDelete, isDeleting, error } = useVersionDelete();

  // Show error toast if there's an error
  if (error) {
    CustomToast.error(error);
  }

  if (!script) return null;

  const handleVersionSelect = (scriptId: string, versionId: string) => {
    router.push(`/dashboard/story/${scriptId}/version/${versionId}`);
    onClose();
  };

  const handleDeleteClick = async () => {
    if (!deleteVersion) return;

    const success = await handleDelete({
      scriptId: script.scriptId,
      versionId: deleteVersion.versionId,
    });

    if (success) {
      setDeleteVersion(null);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "background.paper",
            backgroundImage: "none !important", // Disable MUI's elevation overlay
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 2,
            // ✅ FIXED: Use primary color for border (Gold/Bronze)
            borderColor: "primary.main",
            boxShadow: theme.shadows[24],
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: isDarkMode
                ? "rgba(0, 0, 0, 0.85)"
                : "rgba(0, 0, 0, 0.7)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            pt: 3,
            pb: 2,
            // ✅ FIXED: Use theme text color
            color: "text.primary",
          }}
        >
          <Typography variant="h6" component="div">
            Script Versions
          </Typography>
          <Typography
            variant="subtitle2"
            // ✅ FIXED: Use theme secondary text color
            color="text.secondary"
          >
            {script.scriptTitle}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 3 }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                bgcolor:
                  theme.palette.mode === "dark" ? "error.dark" : "error.light",
                color:
                  theme.palette.mode === "dark"
                    ? "error.contrastText"
                    : "error.dark",
                "& .MuiAlert-icon": {
                  color: "inherit",
                },
              }}
            >
              {error}
            </Alert>
          )}
          {isSuccess && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "success.dark"
                    : "success.light",
                color:
                  theme.palette.mode === "dark"
                    ? "success.contrastText"
                    : "success.dark",
                "& .MuiAlert-icon": {
                  color: "inherit",
                },
              }}
            >
              Version deleted successfully!
            </Alert>
          )}
          <List>
            {script.versions
              .sort((a, b) => b.versionNumber - a.versionNumber)
              .map((version) => (
                <ListItem
                  key={version.versionId}
                  divider
                  sx={{
                    // ✅ FIXED: Use theme background for hover
                    "&:hover": {
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.02)",
                    },
                  }}
                  secondaryAction={
                    <Box>
                      <IconButton
                        onClick={() =>
                          handleVersionSelect(
                            script.scriptId,
                            version.versionId
                          )
                        }
                        // ✅ FIXED: Use primary color (Gold/Bronze)
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          setDeleteVersion({
                            versionId: version.versionId,
                            versionNumber: version.versionNumber,
                          })
                        }
                        color="error"
                        disabled={isDeleting}
                      >
                        {isDeleting &&
                        deleteVersion?.versionId === version.versionId ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          <DeleteIcon />
                        )}
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          // ✅ FIXED: Use theme text color
                          color: "text.primary",
                        }}
                      >
                        Version {version.versionNumber}
                        {version.versionId === script.currentVersion && (
                          <Chip
                            label="Current"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Typography>
                    }
                    secondary={`Created ${formatDate(version.createdAt._seconds)}`}
                    secondaryTypographyProps={{
                      // ✅ FIXED: Use theme secondary text color
                      color: "text.secondary",
                    }}
                  />
                </ListItem>
              ))}
          </List>
        </DialogContent>
      </Dialog>

      <DeleteVersionDialog
        open={!!deleteVersion}
        versionNumber={deleteVersion?.versionNumber || 0}
        isLoading={isDeleting}
        onConfirm={handleDeleteClick}
        onCancel={() => setDeleteVersion(null)}
      />
    </>
  );
}
