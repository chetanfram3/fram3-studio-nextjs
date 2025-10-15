'use client';

import { Box, Typography, LinearProgress } from '@mui/material';
import { getCurrentBrand } from '@/config/brandConfig';
import type { SceneStatus } from '@/types/analysisStatus';

/**
 * ProgressCalculator - Displays progress of scene and shot completion
 * 
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Efficient progress calculation with simple iteration
 * 
 * Theme integration:
 * - Uses theme.palette for all colors
 * - Uses brand configuration for fonts and border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors or spacing
 * 
 * @param scenes - Array of scene status objects with shots
 * @param title - Title to display above the progress bar
 */

interface ProgressCalculatorProps {
  scenes: SceneStatus[];
  title: string;
}

export default function ProgressCalculator({ scenes, title }: ProgressCalculatorProps) {
  const brand = getCurrentBrand();

  const calculateSceneProgress = () => {
    let totalShots = 0;
    let completedShots = 0;

    scenes.forEach((scene) => {
      totalShots += scene.shots.length;
      completedShots += scene.shots.filter(
        (shot) => shot.status === 'Completed'
      ).length;
    });

    return totalShots > 0 ? (completedShots / totalShots) * 100 : 0;
  };

  const progress = calculateSceneProgress();

  const getProgressColor = () => {
    if (progress === 100) return 'success.light';
    if (progress >= 75) return 'warning.light';
    if (progress >= 25) return 'warning.main';
    return 'error.light';
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          width: '100%',
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ 
            flexShrink: 0,
            fontFamily: brand.fonts.body,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ 
            flexShrink: 0,
            fontFamily: brand.fonts.body,
          }}
        >
          {Math.round(progress)}%
        </Typography>
      </Box>
      <Box sx={{ width: 400, mx: 'auto' }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: 'background.default',
            '& .MuiLinearProgress-bar': {
              bgcolor: getProgressColor(),
              borderRadius: `${brand.borderRadius}px`,
            },
          }}
        />
      </Box>
    </Box>
  );
}