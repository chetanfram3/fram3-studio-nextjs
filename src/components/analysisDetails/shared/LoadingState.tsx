"use client";

import { Box, Alert, CircularProgress, Stack } from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";

interface LoadingStateProps {
  message?: string;
}

/**
 * LoadingState - Reusable loading component
 */
export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  const brand = getCurrentBrand();

  return (
    <Box sx={{ py: 4 }}>
      <Alert
        severity="info"
        icon={<CircularProgress size={20} />}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderRadius: `${brand.borderRadius}px`,
          borderLeft: 4,
          borderColor: "primary.main",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {message}
        </Stack>
      </Alert>
    </Box>
  );
}