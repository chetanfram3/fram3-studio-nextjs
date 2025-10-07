import { Components, Theme } from '@mui/material/styles';

export const drawerComponents: Components<Theme>['MuiDrawer'] = {
  styleOverrides: {
    paper: ({ theme }) => ({
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
      '& .MuiDivider-root': {
        borderColor: 'rgba(255, 255, 255, 0.12)'
      },
      '& .MuiListItemButton-root': {
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)'
        }
      },
      '& .MuiListItemIcon-root': {
        color: 'inherit',
        minWidth: 40
      },
      '& .MuiListItemText-root': {
        '& .MuiTypography-root': {
          color: 'inherit'
        }
      },
      '& .MuiAvatar-root': {
        border: '2px solid rgba(255, 255, 255, 0.2)'
      },
      // Override the default list styles specifically for the drawer
      '& .MuiList-root': {
        '& .MuiListItemText-primary': {
          color: 'inherit',
          fontWeight: 500
        },
        '& .MuiListItemText-secondary': {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    })
  }
};