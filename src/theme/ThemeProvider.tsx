// src/theme/ThemeProvider.tsx
'use client';

import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './theme';
import { getCurrentBrand } from '@/config/brandConfig';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return true;
    
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode) return savedMode === 'dark';
    localStorage.setItem('theme-mode', 'dark');
    return true;
  });

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      // Check if we're in the browser
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
        // Update data-theme attribute for CSS variables
        document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
      }
      return newMode;
    });
  }, []);

  // Set initial data-theme and data-brand attributes
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    const brand = getCurrentBrand();
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-brand', brand.id);
  }, [isDarkMode]);

  const theme = useMemo(() => isDarkMode ? darkTheme : lightTheme, [isDarkMode]);

  const contextValue = useMemo(() => ({
    isDarkMode,
    toggleTheme
  }), [isDarkMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
}

export type { ThemeContextType };