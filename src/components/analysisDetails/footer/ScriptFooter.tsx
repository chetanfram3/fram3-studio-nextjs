'use client';

import { Box, Typography } from '@mui/material';
import { getCurrentBrand } from '@/config/brandConfig';
import { formatDate } from '@/utils/dateUtils';

/**
 * ScriptFooter - Displays creation and modification timestamps
 * 
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple component with minimal logic
 * 
 * Theme integration:
 * - Uses brand configuration for fonts
 * - Uses theme text colors
 * - Respects light/dark mode automatically
 * 
 * @param createdAt - Unix timestamp for creation date
 * @param modifiedAt - Unix timestamp for last modification date
 */

interface ScriptFooterProps {
  createdAt: number;
  modifiedAt: number;
}

export default function ScriptFooter({ createdAt, modifiedAt }: ScriptFooterProps) {
  const brand = getCurrentBrand();

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 3
    }}>
      <Typography 
        variant="body2" 
        sx={{
          color: 'text.secondary',
          fontFamily: brand.fonts.body,
        }}
      >
        Created: {formatDate(createdAt)}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{
          color: 'text.secondary',
          fontFamily: brand.fonts.body,
        }}
      >
        Modified: {formatDate(modifiedAt)}
      </Typography>
    </Box>
  );
}