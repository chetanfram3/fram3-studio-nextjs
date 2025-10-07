import { Components, Theme } from '@mui/material/styles';

export const listComponents: Components<Theme>['MuiList'] = {
  defaultProps: {
    disablePadding: true
  },
  styleOverrides: {
    root: ({ theme }) => ({
      // These styles will apply to lists outside the drawer
      '& .MuiListItemText-primary': {
        color: theme.palette.text.primary,
      },
      '& .MuiListItemText-secondary': {
        color: theme.palette.text.secondary,
      }
    })
  }
};

export const listItemComponents: Components<Theme>['MuiListItem'] = {
  styleOverrides: {
    root: {
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)'
      },
      // Specific styles for list items in the drawer will be overridden by drawer styles
      '.MuiDrawer-paper &': {
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)'
        }
      }
    }
  }
};
