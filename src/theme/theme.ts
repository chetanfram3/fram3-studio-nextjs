// src/theme/theme.ts
import { createTheme, Theme } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import { typography } from './typography';
import { components } from './components';
import { getCurrentBrand, getBrandColors } from '@/config/brandConfig';

/**
 * Get the current brand configuration
 * This determines which brand's colors, fonts, and styling to use
 */
const brand = getCurrentBrand();

/**
 * Base theme configuration shared by both light and dark themes
 * Includes brand-specific typography, components, shapes, and transitions
 * 
 * This configuration is merged with mode-specific palettes to create
 * the complete light and dark theme objects
 */
const baseTheme = {
  /**
   * Typography configuration with brand-specific fonts
   * Overrides base typography with current brand's font families
   */
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

  /**
   * MUI component overrides
   * Custom styles for MUI components across all themes
   */
  components,

  /**
   * Shape configuration - border radius
   * Uses brand-specific border radius value
   */
  shape: {
    borderRadius: brand.borderRadius
  },

  /**
   * Responsive breakpoints
   * Defines screen size breakpoints for responsive design
   * 
   * xs: Extra small (mobile) - 0px and up
   * sm: Small (tablet portrait) - 600px and up
   * md: Medium (tablet landscape) - 900px and up
   * lg: Large (desktop) - 1200px and up
   * xl: Extra large (large desktop) - 1536px and up
   * xxl: Custom extra-extra large - 1920px and up
   */
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

  /**
   * Transition durations and easing functions
   * Consistent animation timings across the application
   */
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
 * Create brand-aware palette by merging brand colors with base palette
 * 
 * This function dynamically generates the color palette based on:
 * 1. Current brand configuration
 * 2. Theme mode (light or dark)
 * 3. Base palette defaults
 * 
 * UPDATED FOR FRAM3 LIGHT MODE:
 * - Primary contrast text is now white in light mode (for charcoal background)
 * - Secondary contrast text remains black (works for both orange-gold and white)
 * 
 * @param mode - The theme mode ('light' or 'dark')
 * @returns Complete palette configuration for MUI theme
 */
function createBrandPalette(mode: 'light' | 'dark') {
  // Get brand-specific colors for the current mode
  const brandColors = getBrandColors(brand, mode);

  // Get base palette (contains error, warning, info, success, pastel colors)
  const basePalette = mode === 'light' ? lightPalette : darkPalette;

  return {
    ...basePalette,
    mode,

    /**
     * Primary color configuration
     * Used for main brand identity, primary actions, and key UI elements
     *
     * FRAM3 Light Mode: Deep Charcoal (#1a1a1a) - white text
     * FRAM3 Dark Mode: Gold (#FFD700) - black text
     */
    primary: {
      main: brandColors.primary,
      light: brandColors.primaryLight,
      dark: brandColors.primaryDark,
      contrastText: mode === 'light' ? '#FFFFFF' : '#000000',
    },

    /**
     * Secondary color configuration
     * Used for accents, secondary actions, and complementary UI elements
     *
     * FRAM3 Light Mode: Orange-Gold (#ffa500) - black text
     * FRAM3 Dark Mode: White (#ffffff) - black text
     */
    secondary: {
      main: brandColors.secondary,
      light: brandColors.secondaryLight,
      dark: brandColors.secondaryDark,
      contrastText: '#000000',
    },

    /**
     * Background color configuration
     * Defines page and surface backgrounds
     */
    background: {
      default: brandColors.background,
      paper: brandColors.surface,
    },

    /**
     * Text color configuration
     * Primary and secondary text colors
     */
    text: {
      primary: brandColors.text,
      secondary: brandColors.textSecondary,
    },

    /**
     * Semantic colors from base palette
     * These remain consistent across brands
     */
    error: basePalette.error,
    warning: basePalette.warning,
    info: basePalette.info,
    success: basePalette.success,

    /**
     * Special color palettes from base
     * Pastel colors for decorative elements
     * Yellow color for special highlighting
     */
    pastel: basePalette.pastel,
    yellow: basePalette.yellow,
  };
}

/**
 * Light theme with brand-specific colors and typography
 * 
 * Combines base theme configuration with light mode palette
 * Automatically adapts to current brand selection
 */
export const lightTheme: Theme = createTheme({
  ...baseTheme,
  palette: createBrandPalette('light')
});

/**
 * Dark theme with brand-specific colors and typography
 * 
 * Combines base theme configuration with dark mode palette
 * Automatically adapts to current brand selection
 */
export const darkTheme: Theme = createTheme({
  ...baseTheme,
  palette: createBrandPalette('dark')
});

/**
 * Export current brand info for use in components
 * Allows components to access brand configuration directly
 */
export const currentBrand = brand;