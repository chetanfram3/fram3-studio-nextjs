'use client';

import { Box, Typography } from '@mui/material';
import { useThemeMode } from '@/theme';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const loadOrbitronFont = () => {
  const fontFace = `
    @font-face {
      font-family: 'Orbitron';
      font-style: normal;
      font-weight: 400 900;
      font-display: swap;
      src: url('/fonts/Orbitron-VariableFont_wght.ttf') format('truetype');
    }
  `;

  const style = document.createElement('style');
  style.textContent = fontFace;
  document.head.appendChild(style);
};

export function Logo() {
  const { isDarkMode } = useThemeMode();
  const router = useRouter();

  useEffect(() => {
    loadOrbitronFont();
  }, []);

  const handleLogoClick = () => {
    router.push('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        transition: 'transform 0.3s',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}
      onClick={handleLogoClick}
      className="group"
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: 32, md: 40 },
          height: { xs: 32, md: 40 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: 'transform 0.3s',
          borderRadius: '50%',
          bgcolor: 'background.paper',
          '&:hover': {
            '& .pulse-effect': {
              opacity: 1,
            },
          },
        }}
      >
        <Box
          className="pulse-effect"
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(to bottom right, rgba(255, 203, 5, 0.2), transparent)',
            borderRadius: '50%',
            opacity: 0,
            animation: 'pulse 2s infinite',
            transition: 'opacity 0.3s',
            '@keyframes pulse': {
              '0%': { opacity: 0.3 },
              '50%': { opacity: 0.6 },
              '100%': { opacity: 0.3 },
            },
          }}
        />

        <Box
          component="img"
          src="https://storage.googleapis.com/fram3-ext/Web2/logoFavicons/new256.ico"
          alt="Fram3 Logo"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            zIndex: 10,
            transition: 'all 0.3s',
          }}
        />
      </Box>

      <Typography
        variant="h6"
        sx={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          fontWeight: 700,
          letterSpacing: '0.05em',
          color: 'text.primary',
          transform: { xs: 'translateY(-2px)', md: 'translateY(-4.5px)' },
          transition: 'color 0.3s',
          '& .yellow-text': {
            color: isDarkMode ? '#FFCB05' : '#D4AF37',
            transition: 'color 0.3s',
          },
          '&:hover': {
            color: isDarkMode ? '#FFCB05' : '#D4AF37',
            '& .yellow-text': {
              color: 'text.primary',
            },
          },
        }}
      >
        FRAM
        <span className="yellow-text">3</span>
        <Box
          component="span"
          sx={{ display: { xs: 'none', md: 'inline' } }}
          className="yellow-text"
        >
          {' '}
          STUDIO
        </Box>
      </Typography>
    </Box>
  );
}