// src/components/branding/BrandSwitcher.tsx
'use client';

import { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  Box, 
  Typography,
  Alert,
  AlertTitle,
  Divider,
  Chip
} from '@mui/material';
import { Palette as PaletteIcon, Check as CheckIcon } from '@mui/icons-material';
import { getCurrentBrand, getAvailableBrands, getBrandByKey } from '@/config/brandConfig';

export function BrandSwitcher() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const open = Boolean(anchorEl);
  const currentBrand = getCurrentBrand();
  const availableBrands = getAvailableBrands();

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleBrandSelect = (brandKey: string) => {
    setShowInstructions(true);
    handleClose();
    
    // Auto-hide instructions after 10 seconds
    setTimeout(() => {
      setShowInstructions(false);
    }, 10000);
  };

  return (
    <>
      {/* Brand Switcher Button */}
      <Button
        variant="outlined"
        startIcon={<PaletteIcon />}
        onClick={handleClick}
        sx={{
          borderRadius: currentBrand.borderRadius / 4,
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        {currentBrand.name}
      </Button>

      {/* Brand Selection Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 480,
            mt: 1,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Preview Brands
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Development Mode Only
          </Typography>
        </Box>
        
        <Divider />

        {availableBrands.map((brandKey) => {
          const brand = getBrandByKey(brandKey);
          if (!brand) return null;

          const isActive = brand.id === currentBrand.id;

          return (
            <MenuItem
              key={brand.id}
              onClick={() => handleBrandSelect(brand.id)}
              sx={{
                py: 1.5,
                px: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                position: 'relative',
              }}
            >
              {/* Brand Color Preview */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: `${brand.borderRadius}px`,
                    background: `linear-gradient(135deg, ${brand.colors.light.primary} 0%, ${brand.colors.light.secondary} 100%)`,
                    flexShrink: 0,
                  }}
                />
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontFamily: brand.fonts.heading,
                        fontWeight: 700,
                      }}
                    >
                      {brand.name}
                    </Typography>
                    {isActive && (
                      <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    )}
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {brand.tagline}
                  </Typography>
                </Box>
              </Box>

              {/* Font Preview */}
              <Box sx={{ width: '100%', pl: 6 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontFamily: brand.fonts.body,
                    color: 'text.secondary',
                  }}
                >
                  {brand.fonts.heading.split(',')[0].replace(/"/g, '')} • {brand.fonts.body.split(',')[0].replace(/"/g, '')}
                </Typography>
              </Box>

              {/* Active Indicator */}
              {isActive && (
                <Chip
                  label="Active"
                  size="small"
                  color="success"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    height: 20,
                    fontSize: '0.7rem',
                  }}
                />
              )}
            </MenuItem>
          );
        })}

        <Divider sx={{ my: 1 }} />

        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 To permanently switch brands, update your .env.local file
          </Typography>
        </Box>
      </Menu>

      {/* Instructions Alert */}
      {showInstructions && (
        <Alert
          severity="info"
          onClose={() => setShowInstructions(false)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            maxWidth: 400,
            zIndex: 9999,
            boxShadow: 3,
          }}
        >
          <AlertTitle>How to Switch Brands</AlertTitle>
          <Typography variant="body2" paragraph>
            To switch brands permanently:
          </Typography>
          <Typography variant="body2" component="ol" sx={{ pl: 2, mb: 1 }}>
            <li>Update <code>.env.local</code> file</li>
            <li>Set <code>NEXT_PUBLIC_BRAND_KEY=brandname</code></li>
            <li>Restart the development server</li>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Available brands: {availableBrands.join(', ')}
          </Typography>
        </Alert>
      )}
    </>
  );
}