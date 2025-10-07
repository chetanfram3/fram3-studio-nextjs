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

const commonPalette: CommonPalette = {
  yellow: {
    main: '#FFD700',
    light: '#FFE44D',
    dark: '#FFC000',
    contrastText: '#000000'
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

export const lightPalette: PaletteOptions & CommonPalette = {
  mode: 'light',
  primary: {
    main: "#1E88E5",
    light: "#64B5F6",
    dark: "#1565C0",
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: "#FFA000",
    light: "#FFB74D",
    dark: "#FF8F00",
    contrastText: "#000000",
  },
  background: {
    default: '#FFFFFF',
    paper: '#F5F5F5'
  },
  text: {
    primary: '#000000',
    secondary: '#424242'
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

export const darkPalette: PaletteOptions & CommonPalette = {
  mode: 'dark',
  primary: {
    main: '#FFFFFF',
    light: '#FFFFFF',
    dark: '#E0E0E0',
    contrastText: '#000000'
  },
  secondary: commonPalette.yellow,
  background: {
    default: '#000000',
    paper: '#121212'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3'
  },
  divider: 'rgba(255, 255, 255, 0.12)',
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