"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";

interface DeleteVersionDialogProps {
  open: boolean;
  versionNumber: number;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteVersionDialog({
  open,
  versionNumber,
  isLoading,
  onConfirm,
  onCancel,
}: DeleteVersionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={!isLoading ? onCancel : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Confirm Version Deletion</DialogTitle>
      <DialogContent>
        <Typography color="error" paragraph>
          Warning: This action cannot be undone.
        </Typography>
        <Typography>
          Version {versionNumber} will be permanently deleted, including:
        </Typography>
        <ul>
          <li>All analysis data</li>
          <li>Associated documents</li>
          <li>Generated images</li>
          <li>Audio and video files</li>
        </ul>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? "Deleting..." : "Delete Version"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
