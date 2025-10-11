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
} from "@mui/material";
import {
  VisibilityOutlined as ViewIcon,
  DeleteOutlineOutlined as DeleteIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
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
      setIsSuccess(true); // Show success message
      setTimeout(() => setIsSuccess(false), 3000); // Hide success message after 3 seconds
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
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: "black",
            borderTop: (theme) => `4px solid ${theme.palette.secondary.main}`,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" color="white">
            Script Versions
          </Typography>
          <Typography variant="subtitle2" color="grey.500">
            {script.scriptTitle}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {isSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
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
                  secondaryAction={
                    <Box>
                      <IconButton
                        onClick={() =>
                          handleVersionSelect(
                            script.scriptId,
                            version.versionId
                          )
                        }
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
                          color: "white",
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
                    secondaryTypographyProps={{ color: "grey.500" }}
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
