// src/components/branding/BrandLogo.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { getCurrentBrand } from '@/config/brandConfig';

interface BrandLogoProps {
  onClick?: () => void;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const sizeMap = {
  small: {
    icon: 32,
    text: '1.25rem',
    spacing: 1,
  },
  medium: {
    icon: 40,
    text: '1.5rem',
    spacing: 1.5,
  },
  large: {
    icon: 48,
    text: '1.75rem',
    spacing: 2,
  },
};

export function BrandLogo({ 
  onClick, 
  showText = true, 
  size = 'medium' 
}: BrandLogoProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted before rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const dimensions = sizeMap[size];
  const isDarkMode = theme.palette.mode === 'dark';
  const logoSrc = isDarkMode ? brand.logo.dark : brand.logo.light;

  // Special rendering for FRAM3 brand with animated effects
  if (brand.id === 'fram3') {
    return (
      <Box
        onClick={onClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: dimensions.spacing,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          '&:hover': onClick ? {
            transform: 'scale(1.05)',
          } : {},
        }}
      >
        {/* FRAM3 Logo Icon with pulse animation */}
        <Box
          sx={{
            width: dimensions.icon,
            height: dimensions.icon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDarkMode
              ? 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)'
              : 'linear-gradient(135deg, #1E88E5 0%, #1565C0 100%)',
            borderRadius: '8px',
            position: 'relative',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.8,
              },
            },
          }}
        >
          <Typography
            sx={{
              fontFamily: brand.fonts.heading,
              fontSize: dimensions.icon * 0.5,
              fontWeight: 700,
              color: isDarkMode ? '#000' : '#FFF',
            }}
          >
            F3
          </Typography>
        </Box>

        {/* FRAM3 Brand Text with gradient */}
        {showText && (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography
              sx={{
                fontFamily: brand.fonts.heading,
                fontSize: dimensions.text,
                fontWeight: 700,
                background: isDarkMode
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #FFD700 100%)'
                  : 'linear-gradient(135deg, #1E88E5 0%, #FFA000 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease',
                '&:hover': onClick ? {
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFFFFF 100%)'
                    : 'linear-gradient(135deg, #FFA000 0%, #1E88E5 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                } : {},
              }}
            >
              FRAM
              <Box
                component="span"
                sx={{
                  color: isDarkMode ? '#FFD700' : '#FFA000',
                  fontStyle: 'italic',
                }}
              >
                3
              </Box>
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // Generic brand rendering for ACME, TechCo, and other brands
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: dimensions.spacing,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'scale(1.05)',
          '& img': {
            filter: 'brightness(1.2)',
          },
          '& .brand-name': {
            color: theme.palette.primary.light,
          },
        } : {},
      }}
    >
      {/* Brand Logo Image */}
      <Box
        component="img"
        src={logoSrc}
        alt={`${brand.name} Logo`}
        sx={{
          width: dimensions.icon,
          height: dimensions.icon,
          objectFit: 'contain',
          transition: 'filter 0.3s ease',
        }}
      />

      {/* Brand Name Text */}
      {showText && (
        <Typography
          className="brand-name"
          sx={{
            fontFamily: brand.fonts.heading,
            fontSize: dimensions.text,
            fontWeight: 700,
            color: theme.palette.primary.main,
            letterSpacing: '0.02em',
            transition: 'color 0.3s ease',
          }}
        >
          {brand.name}
        </Typography>
      )}
    </Box>
  );
}