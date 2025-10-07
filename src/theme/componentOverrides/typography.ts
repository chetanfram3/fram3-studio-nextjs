import { Theme } from '@mui/material/styles';
import type { } from '@mui/material/themeCssVarsAugmentation';

export const typography: Partial<Theme['typography']> = {
  fontFamily: '"Rajdhani", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',

  // Headings
  h1: {
    fontFamily: '"Rajdhani", sans-serif', // Heading font
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.3, // Improved readability
    letterSpacing: '-0.01562em',
    '@media (max-width:600px)': {
      fontSize: '2rem', // Responsive font size for mobile
    },
  },
  h2: {
    fontFamily: '"Rajdhani", sans-serif',
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em',
    '@media (max-width:600px)': {
      fontSize: '1.75rem',
    },
  },
  h3: {
    fontFamily: '"Rajdhani", sans-serif',
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0em',
    '@media (max-width:600px)': {
      fontSize: '1.5rem',
    },
  },
  h4: {
    fontFamily: '"Rajdhani", sans-serif',
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.00735em',
    '@media (max-width:600px)': {
      fontSize: '1.25rem',
    },
  },
  h5: {
    fontFamily: '"Rajdhani", sans-serif',
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0em',
    '@media (max-width:600px)': {
      fontSize: '1rem',
    },
  },
  h6: {
    fontFamily: '"Rajdhani", sans-serif',
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0.0075em',
    '@media (max-width:600px)': {
      fontSize: '0.875rem',
    },
  },

  // Subtitles
  subtitle1: {
    fontFamily: '"Inter", sans-serif', // Subtitle font
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.6, // Slightly higher line height for readability
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontFamily: '"Inter", sans-serif', // Subtitle font
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },

  // Body text
  body1: {
    fontFamily: '"Inter", sans-serif', // Body font
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontFamily: '"Inter", sans-serif', // Body font
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.01071em',
  },

  // Buttons
  button: {
    fontFamily: '"Rajdhani", sans-serif', // Buttons typically match heading font
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'none', // Avoid uppercase for better readability
  },

  // Captions
  caption: {
    fontFamily: '"Inter", sans-serif', // Caption font
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },

  // Overline
  overline: {
    fontFamily: '"Rajdhani", sans-serif', // Overline matches heading font
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 2, // Adjusted line height for readability
    letterSpacing: '0.08333em',
    textTransform: 'uppercase',
  },
};
