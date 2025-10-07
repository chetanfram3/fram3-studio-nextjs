// src/assets/icons/fram3-icon.tsx
'use client';

import { SvgIcon } from "@mui/material";
import type { SvgIconProps } from "@mui/material";
import { useTheme } from '@mui/material/styles';

export const FrameIcon = (props: SvgIconProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Use theme colors
  const bubbleColor = theme.palette.primary.main;
  const lensColorDark = isDarkMode ? '#2A2A2A' : '#1A1A1A';
  const lensColorMid = isDarkMode ? '#4A4A4A' : '#333333';
  const lensColorLight = isDarkMode ? '#6A6A6A' : '#666666';

  return (
    <SvgIcon {...props} viewBox="0 0 512 512">
      {/* Speech bubble background */}
      <path
        d="M412 40H100C66.863 40 40 66.863 40 100v256c0 33.137 26.863 60 60 60h52l-32 96 192-96h100c33.137 0 60-26.863 60-60V100c0-33.137-26.863-60-60-60z"
        fill={bubbleColor}
      />
      {/* Camera lens outer ring */}
      <circle cx="256" cy="228" r="120" fill={lensColorDark} />
      {/* Camera lens inner details */}
      <circle cx="256" cy="228" r="100" fill={lensColorMid} />
      <circle cx="256" cy="228" r="80" fill={lensColorDark} />
      {/* Lens reflection */}
      <circle 
        cx="226" 
        cy="198" 
        r="15" 
        fill={lensColorLight} 
        opacity={isDarkMode ? "0.6" : "0.5"} 
      />
    </SvgIcon>
  );
};