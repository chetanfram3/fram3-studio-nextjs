'use client';

import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  HourglassEmpty as NotStartedIcon,
  Refresh as InProgressIcon,
  Help as UnknownIcon,
} from '@mui/icons-material';
import { getCurrentBrand } from '@/config/brandConfig';
import type { StatusType } from '@/types/analysisStatus';
import type { ChipProps } from '@mui/material';

/**
 * StatusChip - Displays analysis status with color-coded chip and icon
 * 
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Simple lookup-based rendering
 * 
 * Theme integration:
 * - Uses theme.palette for all colors via Chip component
 * - Uses brand configuration for fonts
 * - Respects light/dark mode automatically
 * - No hardcoded colors
 * 
 * @param status - The status type to display
 * @param size - Size of the chip (small or medium)
 */

interface StatusChipProps {
  status: StatusType;
  size?: 'small' | 'medium';
}

export default function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Define types for the status configuration
  type StatusColorType = ChipProps['color'];
  
  const statusConfig = {
    Completed: {
      icon: CheckCircleIcon,
      color: 'success' as StatusColorType,
      label: 'Completed'
    },
    Failed: {
      icon: ErrorIcon,
      color: 'error' as StatusColorType,
      label: 'Failed'
    },
    Pending: {
      icon: PendingIcon,
      color: 'warning' as StatusColorType,
      label: 'Pending'
    },
    InProgress: {
      icon: InProgressIcon,
      color: 'info' as StatusColorType,
      label: 'InProgress'
    },
    NotStarted: {
      icon: NotStartedIcon,
      color: 'default' as StatusColorType,
      label: 'Not Started'
    },
    Incomplete: {
      icon: ErrorIcon,
      color: 'warning' as StatusColorType,
      label: 'Incomplete'
    }
  } as const;

  // Handle case when status is undefined or not in the statusConfig
  const config = status && statusConfig[status] ? statusConfig[status] : {
    icon: UnknownIcon,
    color: 'default' as StatusColorType,
    label: status || 'Unknown'
  };

  return (
    <Chip
      icon={<config.icon />}
      label={config.label}
      color={config.color}
      size={size}
      sx={{
        fontFamily: brand.fonts.body,
        '& .MuiChip-icon': {
          fontSize: size === 'small' ? 16 : 20
        }
      }}
    />
  );
}