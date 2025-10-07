'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Container,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Lock as LockIcon,
  LockReset as LockResetIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';
import { registerUser } from '@/services';
import { RegisterData } from '@/types/auth';
import { LogoHeader, PasswordStrengthBar, validatePassword } from '@/components/auth';
import LoadingDots from '@/components/common/LoadingDots';
import logger from '@/utils/logger';

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

const initialFormData: RegisterFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  displayName: '',
};

/**
 * Registration Form Component
 * Complete user registration with validation
 */
export default function RegisterForm() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName.trim() || formData.firstName.length < 2) {
      setError('First name must be at least 2 characters');
      return;
    }

    if (!formData.lastName.trim() || formData.lastName.length < 2) {
      setError('Last name must be at least 2 characters');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    setIsLoading(true);
    logger.debug('Starting registration for:', formData.email);

    try {
      const displayName = formData.displayName || `${formData.firstName} ${formData.lastName}`;
      
      await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        displayName,
      });

      logger.debug('Registration successful');
      router.push('/dashboard');
    } catch (err) {
      logger.error('Registration error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to register. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingDots isLoading={isLoading} text="Creating your account..." />;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: { xs: 2, md: 4 }, mb: 8 }}>
        <LogoHeader />
        
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 2,
            borderColor: 'primary.main',
            bgcolor: 'background.paper',
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
              color: 'text.primary',
              mb: 3,
            }}
          >
            Create an Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* First Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>

              {/* Last Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>

              {/* Phone Number */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                  placeholder="+1 (555) 123-4567"
                  helperText="Include country code"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>

              {/* Display Name (Optional) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Name (Optional)"
                  value={formData.displayName}
                  onChange={handleChange('displayName')}
                  helperText="Leave blank to use full name"
                  InputProps={{
                    startAdornment: <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>

              {/* Password */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  helperText="Must be at least 8 characters with one number and one special character"
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <PasswordStrengthBar password={formData.password} />
              </Grid>

              {/* Confirm Password */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  error={formData.confirmPassword !== '' && formData.password !== formData.confirmPassword}
                  helperText={
                    formData.confirmPassword !== '' && formData.password !== formData.confirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                  InputProps={{
                    startAdornment: <LockResetIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
            </Grid>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={
                  isLoading ? <CircularProgress size={20} /> : <PersonAddIcon />
                }
                sx={{
                  py: 1.5,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: `${brand.borderRadius / 2}px`,
                  transition: theme.transitions.create(['all']),
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                }}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Box>

            {/* Sign In Link */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?
              </Typography>
              <Button
                onClick={() => router.push('/signin')}
                variant="text"
                startIcon={<LoginIcon />}
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Sign in here
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}