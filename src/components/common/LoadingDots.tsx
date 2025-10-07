'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface LoadingDotsProps {
  isLoading: boolean;
  text?: string;
  size?: number;
  fullScreen?: boolean;
}

/**
 * Loading indicator component with optional text
 * Can be displayed as overlay or inline
 */
export default function LoadingDots({ 
  isLoading, 
  text = 'Loading...', 
  size = 60,
  fullScreen = true,
}: LoadingDotsProps) {
  const theme = useTheme();

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : 'auto',
        gap: 2,
        py: fullScreen ? 0 : 4,
      }}
    >
      <CircularProgress 
        size={size} 
        sx={{
          color: 'primary.main',
        }}
      />
      {text && (
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'text.secondary',
            fontWeight: 500,
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
}