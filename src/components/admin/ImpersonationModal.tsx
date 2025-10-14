// src/components/admin/ImpersonationModal.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  CircularProgress,
  Autocomplete,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import { getCurrentBrand } from '@/config/brandConfig';
import { useImpersonation } from '@/hooks/useImpersonation';
import { auth } from '@/lib/firebase';

// ===========================
// TYPE DEFINITIONS
// ===========================

interface ImpersonationModalProps {
  open: boolean;
  onClose: () => void;
}

interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// ===========================
// CONSTANTS
// ===========================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3005';

// ===========================
// HELPER FUNCTIONS
// ===========================

const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const response = await fetch(
      `${API_BASE_URL}/user/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search users');
    }

    const responseData = await response.json();
    const users = responseData?.data?.results || [];

    return users.map((user: Record<string, unknown>) => ({
      uid: user.uid as string,
      email: user.email as string,
      displayName:
        (user.displayName as string | undefined) ||
        `${(user.extendedInfo as Record<string, string> | undefined)?.firstName || ''} ${
          (user.extendedInfo as Record<string, string> | undefined)?.lastName || ''
        }`.trim() ||
        (user.email as string).split('@')[0],
      photoURL: user.photoURL as string | undefined,
    }));
  } catch (error) {
    console.warn('User search API error:', error);

    // Fallback mock data for development
    const mockUsers = [
      { uid: 'user1', email: 'john.doe@example.com', displayName: 'John Doe' },
      {
        uid: 'user2',
        email: 'jane.smith@example.com',
        displayName: 'Jane Smith',
      },
      {
        uid: 'user3',
        email: 'bob.wilson@example.com',
        displayName: 'Bob Wilson',
      },
      {
        uid: 'user4',
        email: 'alice.johnson@example.com',
        displayName: 'Alice Johnson',
      },
    ];

    return mockUsers.filter(
      (user) =>
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(query.toLowerCase())
    );
  }
};

// ===========================
// MAIN COMPONENT
// ===========================

export function ImpersonationModal({ open, onClose }: ImpersonationModalProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { startImpersonatingUser } = useImpersonation();

  // Dialog State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [userInput, setUserInput] = useState('');
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reset form when dialog closes
  const resetForm = useCallback(() => {
    setTargetUser(null);
    setUserInput('');
    setUserOptions([]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  // Debounced user search
  useEffect(() => {
    if (!userInput || userInput.length < 2) {
      setUserOptions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await searchUsers(userInput);
        setUserOptions(users);
      } catch (err) {
        console.error('Search failed:', err);
        setUserOptions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userInput]);

  // Handle impersonation
  const handleImpersonation = async () => {
    if (!targetUser) {
      setError('Please select a user to impersonate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await startImpersonatingUser(targetUser.uid);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start impersonation');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && targetUser && !loading) {
      handleImpersonation();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${brand.borderRadius}px`,
          // Use primary color for border
          border: `1px solid ${theme.palette.primary.main}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontFamily: brand.fonts.heading,
          // Use primary color for title
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <PersonSearchIcon />
        Impersonate User
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              {error}
            </Alert>
          )}

          {/* Info Alert */}
          <Alert 
            severity="info"
            sx={{
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            Select a user to impersonate. You will be logged in as that user and can view their
            data and perform actions on their behalf.
          </Alert>

          {/* User Selection */}
          <Box>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                // Use primary color for section headers
                color: 'primary.main',
                fontWeight: 600,
              }}
            >
              Select User
            </Typography>
            <Autocomplete
              options={userOptions}
              getOptionLabel={(option) =>
                `${option.displayName || option.email} (${option.email})`
              }
              value={targetUser}
              onChange={(_, newValue) => setTargetUser(newValue)}
              inputValue={userInput}
              onInputChange={(_, newValue) => {
                setUserInput(newValue);
              }}
              loading={isSearching}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Users"
                  placeholder="Type email or name..."
                  onKeyDown={handleKeyDown}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        // Use primary color for focused border
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: 'primary.main',
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mr: 1,
                        }}
                      >
                        {isSearching ? (
                          <CircularProgress 
                            size={20} 
                            sx={{ color: 'primary.main' }}
                          />
                        ) : (
                          <PersonSearchIcon 
                            sx={{ color: 'text.secondary' }}
                          />
                        )}
                      </Box>
                    ),
                    endAdornment: params.InputProps.endAdornment,
                  }}
                />
              )}
              noOptionsText={
                !userInput
                  ? 'Start typing to search users'
                  : userInput.length < 2
                    ? 'Type at least 2 characters to search'
                    : 'No users found'
              }
            />
          </Box>

          {/* Selected User Info */}
          {targetUser && (
            <Box
              sx={{
                p: 2,
                borderRadius: `${brand.borderRadius}px`,
                bgcolor: 'background.paper',
                // Use primary color for border
                border: `1px solid ${theme.palette.primary.main}`,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Selected User
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {targetUser.displayName || targetUser.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {targetUser.email}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                User ID: {targetUser.uid}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleImpersonation}
          variant="contained"
          color="primary"
          disabled={loading || !targetUser}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Starting Impersonation...' : 'Start Impersonation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}