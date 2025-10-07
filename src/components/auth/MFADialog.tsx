'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';

interface MFADialogProps {
  open: boolean;
  onClose: () => void;
  verificationCode: string;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  error?: string;
  loading?: boolean;
  phoneNumber?: string;
}

/**
 * Multi-Factor Authentication dialog
 * Prompts user for verification code
 */
export default function MFADialog({
  open,
  onClose,
  verificationCode,
  onCodeChange,
  onVerify,
  error,
  loading = false,
  phoneNumber,
}: MFADialogProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiPaper-root': {
          bgcolor: 'background.paper',
          borderRadius: `${brand.borderRadius * 1.5}px`,
          border: 2,
          borderColor: 'primary.main',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          fontFamily: brand.fonts.heading,
          fontWeight: 600,
          pt: 3,
        }}
      >
        Two-Factor Authentication
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body1" paragraph sx={{ textAlign: 'center' }}>
            Please enter the 6-digit verification code sent to{' '}
            {phoneNumber && (
              <Typography component="span" sx={{ fontWeight: 600 }}>
                {phoneNumber}
              </Typography>
            )}
            {!phoneNumber && 'your phone'}
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Verification Code"
            type="text"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              onCodeChange(value);
            }}
            disabled={loading}
            placeholder="000000"
            inputProps={{
              inputMode: 'numeric',
              pattern: '[0-9]*',
              maxLength: 6,
              style: {
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5em',
                fontWeight: 600,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 2,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            Didn't receive the code? Check your messages or try again in a few
            moments.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              borderRadius: `${brand.borderRadius / 2}px`,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={verificationCode.length !== 6 || loading}
            variant="contained"
            sx={{
              borderRadius: `${brand.borderRadius / 2}px`,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 120,
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Verify'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
