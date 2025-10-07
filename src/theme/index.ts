// Export theme provider and hook
export { ThemeProvider, useThemeMode } from './ThemeProvider';

// Export themes
export { lightTheme, darkTheme } from './theme';

// Export individual theme parts for direct access if needed
export { lightPalette, darkPalette } from './palette';
export { typography } from './typography';
export { components } from './components';

// Re-export types that might be needed
export type { ThemeContextType } from './ThemeProvider';