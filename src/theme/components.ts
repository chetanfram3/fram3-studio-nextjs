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
      root: {
        borderRadius: brand.borderRadius,
        textTransform: 'none',
        fontWeight: 600,
      },
      contained: ({ theme }) => ({
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
          backgroundColor: theme.palette.mode === 'light' 
            ? theme.palette.grey[900] 
            : theme.palette.grey[100],
        },
      }),
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: brand.borderRadius * 1.5, // Slightly larger for cards
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: brand.borderRadius * 1.5, // Slightly larger for papers
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
};