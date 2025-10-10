// src/theme/components.ts
import { Components, Theme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';

// Get current brand for border radius
const brand = getCurrentBrand();

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarColor: '#6b6b6b #2b2b2b',
        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
          borderRadius: brand.borderRadius,
          backgroundColor: '#6b6b6b',
          minHeight: 24,
        },
        '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
          backgroundColor: '#959595',
        },
        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#959595',
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: ({ }) => ({
        borderRadius: brand.borderRadius,
        textTransform: 'none',
        fontWeight: 600,
        fontFamily: brand.fonts.heading,
      }),
      contained: ({ }) => ({
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      }),
      // Text variant for links (Register Now, etc.)
      text: ({ }) => ({
        '&:hover': {
          backgroundColor: 'rgba(255, 215, 0, 0.08)', // Gold with transparency
        },
      }),
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: brand.borderRadius * 1.5,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: brand.borderRadius * 1.5,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: brand.borderRadius,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: brand.borderRadius,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: brand.borderRadius * 1.5,
      },
    },
  },
};