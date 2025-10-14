// src/components/aiScriptGen/components/FormatCtaSection.tsx
'use client';

import { useState, useMemo, JSX } from 'react';
import {
  Box,
  Typography,
  Collapse,
  Button,
  FormControl,
  Select,
  MenuItem,
  Slider,
  useTheme,
  Chip,
  IconButton,
  Paper,
  Stack,
  alpha,
} from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import type { FormValues } from '../types';
import CTAUrgencySection from './CTAUrgencySection';
import { getCurrentBrand } from '@/config/brandConfig';

interface FormatCtaSectionProps {
  form: UseFormReturn<FormValues>;
}

interface ScriptFormatOption {
  value: string;
  label: string;
}

interface AspectRatioOption {
  value: string;
  label: string;
}

interface ScriptTypeOption {
  value: string;
  label: string;
}

const FormatCtaSection = ({ form }: FormatCtaSectionProps): JSX.Element => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [scriptOptionsExpanded, setScriptOptionsExpanded] = useState(true);

  // Memoize static option arrays (they never change)
  const scriptFormatOptions: ScriptFormatOption[] = useMemo(
    () => [
      { value: 'two-column', label: 'Two-Column A/V' },
      { value: 'screenplay', label: 'Screenplay' },
      { value: 'narrative', label: 'Narrative' },
      { value: 'storyboard', label: 'Storyboard Text' },
    ],
    []
  );

  const aspectRatioOptions: AspectRatioOption[] = useMemo(
    () => [
      { value: '16:9', label: 'Widescreen' },
      { value: '9:16', label: 'Vertical' },
      { value: '4:3', label: 'Standard' },
      { value: '1:1', label: 'Square' },
      { value: '21:9', label: 'Ultrawide' },
    ],
    []
  );

  const scriptTypeOptions: ScriptTypeOption[] = useMemo(
    () => [
      { value: 'commercial', label: 'Commercial' },
      { value: 'trailer', label: 'Trailer' },
      { value: 'teaser', label: 'Teaser' },
      { value: 'promo', label: 'Promotional Video' },
      { value: 'social', label: 'Social Media' },
      { value: 'corporate', label: 'Corporate Video' },
      { value: 'explainer', label: 'Explainer Video' },
      { value: 'documentary', label: 'Documentary' },
    ],
    []
  );

  // Get current form values
  const scriptType = form.watch('formatAndCTA.scriptType') || 'commercial';
  const scriptFormat = form.watch('formatAndCTA.scriptFormat') || 'two-column';
  const aspectRatio = form.watch('formatAndCTA.aspectRatio') || '16:9';
  const duration = form.watch('desiredDuration') || 30;

  // Memoize computed values
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(duration / 60);
    const seconds = (duration % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [duration]);

  const toggleExpanded = (): void => {
    setScriptOptionsExpanded(!scriptOptionsExpanded);
  };

  const handleScriptTypeChange = (value: string): void => {
    form.setValue('formatAndCTA.scriptType', value);
  };

  const handleAspectRatioChange = (value: string): void => {
    form.setValue('formatAndCTA.aspectRatio', value);
  };

  const handleCustomDuration = (): void => {
    const customValue = window.prompt(
      'Enter custom duration (seconds):',
      duration.toString()
    );
    if (customValue && !isNaN(Number(customValue))) {
      const clampedValue = Math.min(Math.max(Number(customValue), 0), 180);
      form.setValue('desiredDuration', clampedValue);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Script Options Section */}
      <Paper
        sx={{
          mb: 3,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
          borderRadius: `${brand.borderRadius}px`,
        }}
      >
        {/* Script Options Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={toggleExpanded}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle2"
              fontWeight="medium"
              sx={{ fontFamily: brand.fonts.heading }}
            >
              Script Options
            </Typography>
            <Chip
              size="small"
              label={`${scriptType} / ${scriptFormat}`}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                color: 'primary.main',
                fontSize: '0.8rem',
                height: '20px',
                fontWeight: 500,
                fontFamily: brand.fonts.body,
              }}
            />
          </Box>
          <IconButton size="small" color="primary">
            {scriptOptionsExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </IconButton>
        </Box>

        <Collapse in={scriptOptionsExpanded}>
          <Box sx={{ p: 2 }}>
            {/* Script Type */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  textAlign: 'center',
                  fontFamily: brand.fonts.body,
                }}
              >
                Script Type
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 0.5,
                  width: '100%',
                }}
              >
                {scriptTypeOptions.map((option) => {
                  const isSelected = scriptType === option.value;
                  return (
                    <Button
                      key={option.value}
                      fullWidth
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => handleScriptTypeChange(option.value)}
                      sx={{
                        borderWidth: 1,
                        borderStyle: 'solid',
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.2)
                          : 'transparent',
                        borderColor: isSelected
                          ? alpha(theme.palette.primary.dark, 0.3)
                          : 'divider',
                        color: isSelected ? 'primary.main' : 'text.primary',
                        '&:hover': {
                          bgcolor: isSelected
                            ? 'primary.main'
                            : 'action.hover',
                          color: isSelected
                            ? 'primary.contrastText'
                            : 'primary.main',
                        },
                        px: 1.5,
                        py: 0.75,
                        textTransform: 'none',
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* Script Format */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  textAlign: 'center',
                  fontFamily: brand.fonts.body,
                }}
              >
                Script Format
              </Typography>
              <Controller
                name="formatAndCTA.scriptFormat"
                control={form.control}
                render={({ field }) => (
                  <FormControl
                    fullWidth
                    size="small"
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <Select
                      {...field}
                      displayEmpty
                      sx={{
                        '& .MuiSelect-select': {
                          py: 1.5,
                          fontFamily: brand.fonts.body,
                        },
                      }}
                      renderValue={(value) => {
                        if (!value) return '-- Select Script Format --';
                        const option = scriptFormatOptions.find(
                          (opt) => opt.value === value
                        );
                        return option?.label || value;
                      }}
                      IconComponent={(props) => (
                        <ChevronDown
                          {...props}
                          size={18}
                          color={theme.palette.primary.main}
                        />
                      )}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: 'background.paper',
                            '& .MuiMenuItem-root': {
                              justifyContent: 'center',
                              fontFamily: brand.fonts.body,
                            },
                            '& .Mui-selected': {
                              color: 'primary.main',
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                            },
                          },
                        },
                      }}
                    >
                      {scriptFormatOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            {/* Aspect Ratio */}
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  textAlign: 'center',
                  fontFamily: brand.fonts.body,
                }}
              >
                Aspect Ratio
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${aspectRatioOptions.length}, 1fr)`,
                  gap: 0.5,
                  width: '100%',
                }}
              >
                {aspectRatioOptions.map((option) => {
                  const isSelected = aspectRatio === option.value;
                  return (
                    <Button
                      key={option.value}
                      fullWidth
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => handleAspectRatioChange(option.value)}
                      sx={{
                        borderWidth: 1,
                        borderStyle: 'solid',
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.2)
                          : 'transparent',
                        borderColor: isSelected
                          ? alpha(theme.palette.primary.dark, 0.3)
                          : 'divider',
                        color: isSelected ? 'primary.main' : 'text.primary',
                        '&:hover': {
                          bgcolor: isSelected
                            ? 'primary.dark'
                            : 'action.hover',
                          color: isSelected
                            ? 'primary.contrastText'
                            : 'primary.main',
                        },
                        px: 1.5,
                        py: 0.75,
                        textTransform: 'none',
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      {option.value}
                    </Button>
                  );
                })}
              </Box>

              {/* Aspect Ratio Labels */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${aspectRatioOptions.length}, 1fr)`,
                  gap: 1,
                  mt: 0.5,
                }}
              >
                {aspectRatioOptions.map((option) => (
                  <Typography
                    key={option.value}
                    variant="caption"
                    sx={{
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.secondary',
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {option.label}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* Call to Action & Genre/Duration Sections */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 3,
          alignItems: 'start',
          mt: 3,
        }}
      >
        {/* Left Column (CTA) */}
        <CTAUrgencySection form={form} />

        {/* Right Column (Genre + Duration) */}
        <Box>
          <Stack spacing={3}>
            {/* Genre */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 2,
                  fontFamily: brand.fonts.heading,
                }}
              >
                Genre
              </Typography>
              <Controller
                name="genre"
                control={form.control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <Select
                      {...field}
                      value={field.value || ''}
                      displayEmpty
                      sx={{
                        bgcolor: 'background.paper',
                        '& .MuiSelect-select': {
                          py: 1.5,
                          fontFamily: brand.fonts.body,
                        },
                      }}
                      renderValue={(value) => {
                        if (!value) return '-- Select Genre --';
                        return value.charAt(0).toUpperCase() + value.slice(1);
                      }}
                      IconComponent={(props) => (
                        <ChevronDown
                          {...props}
                          size={18}
                          color={theme.palette.primary.main}
                        />
                      )}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: 'background.paper',
                            '& .MuiMenuItem-root': {
                              justifyContent: 'center',
                              fontFamily: brand.fonts.body,
                            },
                            '& .Mui-selected': {
                              color: 'primary.main',
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="">-- Select Genre --</MenuItem>
                      <MenuItem value="action">Action</MenuItem>
                      <MenuItem value="comedy">Comedy</MenuItem>
                      <MenuItem value="drama">Drama</MenuItem>
                      <MenuItem value="documentary">Documentary</MenuItem>
                      <MenuItem value="informative">Informative</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>

            {/* Duration */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 2,
                  fontFamily: brand.fonts.heading,
                }}
              >
                Desired Duration
              </Typography>

              {/* Slider */}
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  p: 1,
                  borderRadius: `${brand.borderRadius}px`,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    0s
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    60s
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    120s
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: brand.fonts.body }}
                  >
                    180s
                  </Typography>
                </Box>
                <Controller
                  name="desiredDuration"
                  control={form.control}
                  render={({ field }) => (
                    <Slider
                      {...field}
                      min={0}
                      max={180}
                      step={5}
                      marks={[
                        { value: 0 },
                        { value: 60 },
                        { value: 120 },
                        { value: 180 },
                      ]}
                      valueLabelDisplay="off"
                      sx={{
                        color: 'primary.main',
                        height: 8,
                        '& .MuiSlider-track': {
                          border: 'none',
                          height: 8,
                        },
                        '& .MuiSlider-rail': {
                          height: 8,
                          opacity: 0.5,
                          backgroundColor: theme.palette.divider,
                        },
                        '& .MuiSlider-thumb': {
                          height: 18,
                          width: 18,
                          border: '2px solid #FFFFFF',
                          backgroundColor: 'primary.main',
                          '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible':
                            {
                              boxShadow: 'inherit',
                            },
                        },
                        '& .MuiSlider-mark': {
                          backgroundColor: 'primary.main',
                          height: 8,
                          width: 8,
                          borderRadius: '50%',
                          marginTop: 0,
                        },
                      }}
                    />
                  )}
                />
                {/* Time Counter & Custom Button aligned */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '1.25rem',
                        color: 'primary.main',
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      {duration}
                    </Box>
                    <Box sx={{ ml: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        seconds
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        textAlign="center"
                        sx={{ fontFamily: brand.fonts.heading }}
                      >
                        {formattedTime}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCustomDuration}
                    sx={{
                      borderColor: 'divider',
                      color: 'text.primary',
                      fontFamily: brand.fonts.body,
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    Custom
                  </Button>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

FormatCtaSection.displayName = 'FormatCtaSection';

export default FormatCtaSection;