// src/theme/palette.ts
import { PaletteOptions, PaletteColor } from '@mui/material/styles';

interface CommonPalette {
  yellow: PaletteColor;
  pastel: {
    pink: PaletteColor;
    peach: PaletteColor;
    mint: PaletteColor;
    lavender: PaletteColor;
    lilac: PaletteColor;
    coral: PaletteColor;
    sage: PaletteColor;
    sky: PaletteColor;
  };
}

/**
 * Common palette colors shared across themes
 * Yellow is FRAM3's signature color
 */
const commonPalette: CommonPalette = {
  yellow: {
    main: '#FFD700',      // Gold - FRAM3's primary color
    light: '#FFE44D',     // Light Gold
    dark: '#FFC000',      // Dark Gold
    contrastText: '#000000' // Black text on gold
  },
  pastel: {
    pink: {
      main: "#FFB3BA",
      light: "#FFC6CC",
      dark: "#FF9AA3",
      contrastText: "#000000",
    },
    peach: {
      main: "#FFDFBA",
      light: "#FFE8CC",
      dark: "#FFD6A3",
      contrastText: "#000000",
    },
    mint: {
      main: "#BAFFC9",
      light: "#CCFFD6",
      dark: "#A3FFB3",
      contrastText: "#000000",
    },
    lavender: {
      main: "#BAE1FF",
      light: "#CCE8FF",
      dark: "#A3D9FF",
      contrastText: "#000000",
    },
    lilac: {
      main: "#E2BAFF",
      light: "#E8CCFF",
      dark: "#D9A3FF",
      contrastText: "#000000",
    },
    coral: {
      main: "#FFB5A7",
      light: "#FFC6BC",
      dark: "#FFA392",
      contrastText: "#000000",
    },
    sage: {
      main: "#C1E1C1",
      light: "#D1E8D1",
      dark: "#B0D9B0",
      contrastText: "#000000",
    },
    sky: {
      main: "#A2D2FF",
      light: "#B8DDFF",
      dark: "#8BC6FF",
      contrastText: "#000000",
    },
  },
};

/**
 * FRAM3 Light Mode Palette - UPDATED
 * Based on page.tsx gradient and background colors
 *
 * DESIGN PHILOSOPHY:
 * - Primary: Bronze-Brown (#8d600d) - midpoint of #1a1a1a → #ffa500 gradient
 * - Secondary: Orange-Gold (#ffa500) for accents and highlights
 * - Background: Light Gray (#f8f9fa) from page.tsx
 * - High contrast, warm, accessible (WCAG AAA compliant)
 */
export const lightPalette: PaletteOptions & CommonPalette = {
  mode: 'light',
  primary: {
    main: '#8d600d',           // Bronze-Brown - midpoint of gradient
    light: '#b77d11',          // Lighter bronze for hover states
    dark: '#634309',           // Darker bronze for emphasis
    contrastText: '#FFFFFF'    // White text on bronze buttons
  },
  secondary: {
    main: '#ffa500',           // Orange-Gold - accents
    light: '#ffc04d',          // Light Orange-Gold
    dark: '#ff8c00',           // Dark Orange-Gold
    contrastText: '#000000',   // Black text on orange-gold
  },
  background: {
    default: '#f8f9fa',        // Light gray background (from page.tsx)
    paper: '#ffffff'           // White for cards/elevated surfaces
  },
  text: {
    primary: '#1a1a1a',        // Deep Charcoal text
    secondary: '#6b7280'       // Medium Gray secondary text
  },
  divider: 'rgba(0, 0, 0, 0.12)',
  error: {
    main: '#D32F2F',
    light: '#EF5350',
    dark: '#C62828'
  },
  warning: {
    main: '#ED6C02',
    light: '#FF9800',
    dark: '#E65100'
  },
  info: {
    main: '#0288D1',
    light: '#03A9F4',
    dark: '#01579B'
  },
  success: {
    main: '#2E7D32',
    light: '#4CAF50',
    dark: '#1B5E20'
  },
  ...commonPalette,
};

/**
 * FRAM3 Dark Mode Palette
 * Gold/White color scheme for dark backgrounds
 */
export const darkPalette: PaletteOptions & CommonPalette = {
  mode: 'dark',
  primary: {
    main: '#FFD700',           // Gold - buttons, borders, links
    light: '#FFE44D',          // Light Gold - hover effects, glow
    dark: '#FFC000',           // Dark Gold - darker borders
    contrastText: '#000000'    // Black text on gold button
  },
  secondary: {
    main: '#FFFFFF',           // White - secondary text, inverse colors
    light: '#FFFFFF',          // Pure White
    dark: '#E0E0E0',           // Light Gray
    contrastText: '#000000',   // Black text on white
  },
  background: {
    default: '#000000',        // Pure black background
    paper: '#121212'          // Very dark gray for cards/surfaces
  },
  text: {
    primary: '#FFFFFF',        // White text
    secondary: '#B3B3B3'       // Light gray secondary text
  },
  divider: 'rgba(255, 215, 0, 0.2)', // Subtle gold divider
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F'
  },
  warning: {
    main: '#FFA726',
    light: '#FFB74D',
    dark: '#F57C00'
  },
  info: {
    main: '#29B6F6',
    light: '#4FC3F7',
    dark: '#0288D1'
  },
  success: {
    main: '#66BB6A',
    light: '#81C784',
    dark: '#388E3C'
  },
  ...commonPalette,
};

/**
 * Pastel colors for light mode
 */
interface PastelColors {
  pink: string;
  peach: string;
  mint: string;
  lavender: string;
  lilac: string;
  coral: string;
  sage: string;
  sky: string;
}

export const pastelLight: PastelColors = {
  pink: "#FFD1DC",
  peach: "#FFDAB9",
  mint: "#C7F2D4",
  lavender: "#D4E1FF",
  lilac: "#E6D2FF",
  coral: "#FFD0C4",
  sage: "#D0E6D0",
  sky: "#C4E3FF",
};

/**
 * Pastel colors for dark mode
 */
export const pastelDark: PastelColors = {
  pink: "#8C6F75",
  peach: "#8C7A66",
  mint: "#6D8674",
  lavender: "#737C8C",
  lilac: "#7E738C",
  coral: "#8C6A6A",
  sage: "#728C72",
  sky: "#6B7C8C",
};