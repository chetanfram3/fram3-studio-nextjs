'use client';

import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';
import { Category } from '@/types/analysis';

/**
 * CategoryChips - Displays content categories as interactive chips
 * 
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - No manual useCallback/useMemo unless necessary
 * 
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 * 
 * @param categories - Array of content categories with confidence scores
 */

interface CategoryChipsProps {
  categories: Category[];
}

export default function CategoryChips({ categories }: CategoryChipsProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  if (!categories.length) {
    return (
      <Box>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{
            fontFamily: brand.fonts.heading,
            color: 'text.primary',
          }}
        >
          Content Categories
        </Typography>
        <Typography 
          color="text.secondary"
          sx={{
            fontFamily: brand.fonts.body,
          }}
        >
          No categories detected.
        </Typography>
      </Box>
    );
  }

  // Sort categories by confidence (React 19 compiler auto-memoizes)
  const sortedCategories = [...categories].sort((a, b) => b.confidence - a.confidence);

  return (
    <Box>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{
          fontFamily: brand.fonts.heading,
          color: 'text.primary',
        }}
      >
        Content Categories
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {sortedCategories.map((category) => {
          const confidence = (category.confidence * 100).toFixed(1);
          const label = category.name.split('/').pop() || category.name;
          
          return (
            <Tooltip 
              key={category.name}
              title={`Full category: ${category.name}`}
              arrow
            >
              <Chip
                label={`${label} (${confidence}%)`}
                color="primary"
                variant={category.confidence > 0.5 ? "filled" : "outlined"}
                sx={{
                  fontSize: '0.9rem',
                  height: 32,
                  fontFamily: brand.fonts.body,
                  '& .MuiChip-label': {
                    px: 2
                  }
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}