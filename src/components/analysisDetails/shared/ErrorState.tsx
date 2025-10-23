"use client";

import { Box, Alert, Button, Stack } from "@mui/material";
import { Refresh as RefreshIcon } from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";

interface ErrorStateProps {
  error: string | Error | null;
  onRetry?: () => void;
}

/**
 * ErrorState - Reusable error component
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const brand = getCurrentBrand();

  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  return (
    <Box sx={{ py: 4 }}>
      <Alert
        severity="error"
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderRadius: `${brand.borderRadius}px`,
          borderLeft: 4,
          borderColor: "error.main",
        }}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
      >
        <Stack spacing={1}>
          <strong>Error loading script details</strong>
          <div>{errorMessage}</div>
        </Stack>
      </Alert>
    </Box>
  );
}
