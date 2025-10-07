import { IconButton, Tooltip, useTheme } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useThemeMode } from '@/theme';

export function ThemeSwitch() {
  const { isDarkMode, toggleTheme } = useThemeMode();
  const theme = useTheme();

  return (
    <Tooltip 
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      arrow
      enterDelay={300}
    >
      <IconButton
        onClick={toggleTheme}
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          width: 40,
          height: 40,
          borderRadius: 1,
          transition: theme.transitions.create(
            ['background-color', 'transform', 'box-shadow'],
            {
              duration: theme.transitions.duration.shorter,
            }
          ),
          '&:active': {
            transform: 'scale(0.95)',
          },
          '& .MuiSvgIcon-root': {
            fontSize: 20,
            transition: theme.transitions.create(['transform', 'opacity'], {
              duration: theme.transitions.duration.shorter,
            }),
          },
          '&:hover .MuiSvgIcon-root': {
            transform: 'rotate(12deg)',
          },
        }}
      >
        {isDarkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
}