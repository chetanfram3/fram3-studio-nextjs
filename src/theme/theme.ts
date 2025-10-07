// src/theme/theme.ts
import { createTheme, Theme } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import { typography } from './typography';
import { components } from './components';
import { getCurrentBrand, getBrandColors } from '@/config/brandConfig';

// Get the current brand configuration
const brand = getCurrentBrand();

/**
 * Base theme configuration shared by both light and dark themes
 * Now includes brand-specific settings
 */
const baseTheme = {
  typography: {
    ...typography,
    // Override font families with brand fonts
    fontFamily: brand.fonts.body,
    h1: { 
      ...typography.h1, 
      fontFamily: brand.fonts.heading 
    },
    h2: { 
      ...typography.h2, 
      fontFamily: brand.fonts.heading 
    },
    h3: { 
      ...typography.h3, 
      fontFamily: brand.fonts.heading 
    },
    h4: { 
      ...typography.h4, 
      fontFamily: brand.fonts.heading 
    },
    h5: { 
      ...typography.h5, 
      fontFamily: brand.fonts.heading 
    },
    h6: { 
      ...typography.h6, 
      fontFamily: brand.fonts.heading 
    },
    button: {
      ...typography.button,
      fontFamily: brand.fonts.heading,
    },
    overline: {
      ...typography.overline,
      fontFamily: brand.fonts.heading,
    },
  },
  components,
  shape: {
    borderRadius: brand.borderRadius
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      xxl: 1920
    }
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    }
  }
};

/**
 * Get brand-aware palette by merging brand colors with base palette
 */
function createBrandPalette(mode: 'light' | 'dark') {
  const brandColors = getBrandColors(brand, mode);
  const basePalette = mode === 'light' ? lightPalette : darkPalette;
  
  return {
    ...basePalette,
    mode,
    primary: {
      main: brandColors.primary,
      light: brandColors.primaryLight,
      dark: brandColors.primaryDark,
      contrastText: mode === 'light' ? '#FFFFFF' : '#000000',
    },
    secondary: {
      main: brandColors.secondary,
      light: brandColors.secondaryLight,
      dark: brandColors.secondaryDark,
      contrastText: mode === 'light' ? '#000000' : '#000000',
    },
    background: {
      default: brandColors.background,
      paper: brandColors.surface,
    },
    text: {
      primary: brandColors.text,
      secondary: brandColors.textSecondary,
    },
    // Keep existing error, warning, info, success colors from base palette
    error: basePalette.error,
    warning: basePalette.warning,
    info: basePalette.info,
    success: basePalette.success,
    // Keep pastel colors and yellow from base palette
    pastel: basePalette.pastel,
    yellow: basePalette.yellow,
  };
}

/**
 * Light theme with brand-specific colors and typography
 */
export const lightTheme: Theme = createTheme({
  ...baseTheme,
  palette: createBrandPalette('light')
});

/**
 * Dark theme with brand-specific colors and typography
 */
export const darkTheme: Theme = createTheme({
  ...baseTheme,
  palette: createBrandPalette('dark')
});

/**
 * Export brand info for use in components
 */
export const currentBrand = brand;