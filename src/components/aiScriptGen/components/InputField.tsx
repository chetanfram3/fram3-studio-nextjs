// src/modules/scripts/components/InputField.tsx
import React from 'react';
import { Box, Typography, TextField, TextFieldProps, useTheme } from '@mui/material';

interface InputFieldProps extends Omit<TextFieldProps, 'variant'> {
  label: React.ReactNode;
  multiline?: boolean;
  rows?: number;
  sx?: any;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  placeholder, 
  multiline = false,
  rows = 1,
  sx = {},
  ...props 
}) => {
  const theme = useTheme();
  
  return (
    <Box sx={sx}>
      <Typography 
        variant="subtitle1" 
        component="label" 
        sx={{ 
          display: 'block', 
          mb: 1.5,
          fontWeight: 500,
          color: 'text.primary'
        }}
      >
        {label}
      </Typography>
      
      <TextField
        fullWidth
        placeholder={placeholder}
        multiline={multiline}
        rows={rows}
        sx={{
          '& .MuiOutlinedInput-root': {
            color: 'text.primary',
            bgcolor: 'background.paper',
            '& fieldset': {
              border: 'none',
            },
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? '#1A1A1A' : '#F5F5F5',
            },
            '&.Mui-focused': {
              bgcolor: theme.palette.mode === 'dark' ? '#1A1A1A' : '#F5F5F5',
              // Use secondary main for the outline in both themes
              outline: `1px solid ${theme.palette.secondary.main}`,
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 14px',
            fontSize: '0.95rem',
          },
          '& .MuiInputBase-input::placeholder': {
            color: theme.palette.mode === 'dark' ? '#666' : '#9E9E9E',
            opacity: 1,
          },
        }}
        InputProps={{
          sx: {
            border: 'none',
          }
        }}
        {...props}
      />
    </Box>
  );
};

export default InputField;