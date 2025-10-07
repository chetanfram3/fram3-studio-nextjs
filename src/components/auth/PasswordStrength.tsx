'use client';

import zxcvbn from 'zxcvbn';
import { Box, Typography } from '@mui/material';
import { PasswordValidation } from '@/types/auth';

/**
 * Validate password strength and requirements
 */
export const validatePassword = (password: string): PasswordValidation => {
  const result = zxcvbn(password);
  
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }
  
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character (!@#$%^&*)'
    };
  }
  
  if (result.score < 2) {
    return {
      isValid: false,
      message: 'Password is too weak. ' + (result.feedback.warning || 'Please make it stronger.')
    };
  }
  
  return { isValid: true, message: '' };
};

interface PasswordStrengthBarProps {
  password: string;
}

/**
 * Visual password strength indicator
 * Shows strength bars and feedback
 */
export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const result = zxcvbn(password);
  const score = result.score;

  const getStrengthColor = () => {
    switch (score) {
      case 0: return '#ff4444';
      case 1: return '#ffad31';
      case 2: return '#ffd300';
      case 3: return '#00c851';
      case 4: return '#007e33';
      default: return '#eee';
    }
  };

  const getStrengthText = () => {
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  if (!password) return null;

  return (
    <Box sx={{ mt: 1 }}>
      {/* Strength Bars */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {[...Array(5)].map((_, i) => (
          <Box
            key={i}
            sx={{
              height: 4,
              flex: 1,
              bgcolor: i <= score ? getStrengthColor() : '#eee',
              transition: 'background-color 0.3s ease',
              borderRadius: 0.5,
            }}
          />
        ))}
      </Box>
      
      {/* Strength Text */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: getStrengthColor(), 
            fontWeight: 600,
          }}
        >
          {getStrengthText()}
        </Typography>
        
        {/* Feedback Warning */}
        {result.feedback.warning && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
            }}
          >
            ({result.feedback.warning})
          </Typography>
        )}
      </Box>
      
      {/* Suggestions */}
      {result.feedback.suggestions && result.feedback.suggestions.length > 0 && (
        <Box sx={{ mt: 0.5 }}>
          {result.feedback.suggestions.map((suggestion, index) => (
            <Typography 
              key={index}
              variant="caption" 
              sx={{ 
                display: 'block',
                color: 'text.secondary',
                fontSize: '0.7rem',
              }}
            >
              • {suggestion}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}