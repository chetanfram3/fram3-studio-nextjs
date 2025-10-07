// src/theme/types.d.ts
import '@mui/material/styles';
import type { PaletteColor, Theme as MuiTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  // Breakpoints
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    xxl: true;
  }

  // Pastel Palette interface
  interface PastelPalette {
    pink: PaletteColor;
    peach: PaletteColor;
    mint: PaletteColor;
    lavender: PaletteColor;
    lilac: PaletteColor;
    coral: PaletteColor;
    sage: PaletteColor;
    sky: PaletteColor;
  }

  // Extend the Palette interface
  interface Palette {
    pastel: PastelPalette;
    yellow: PaletteColor;
  }

  // Extend PaletteOptions
  interface PaletteOptions {
    pastel?: PastelPalette;
    yellow?: PaletteColor;
  }

  // Extend Theme
  interface Theme extends MuiTheme {
    palette: Palette;
  }
}