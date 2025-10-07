import { Components, Theme } from '@mui/material/styles';

export const appBarComponents: Components<Theme>['MuiAppBar'] = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: theme.palette.primary.main,
      '& .MuiToolbar-root': {
        color: theme.palette.common.white
      }
    })
  }
};