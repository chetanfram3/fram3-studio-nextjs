'use client';

import { Box, Container, Typography, Button, Card, CardContent } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import { getCurrentBrand } from '@/config/brandConfig';
import { AuthGuard } from '@/components/auth';
import { useAuth } from '@/hooks/auth/useAuth';
import { signOut } from '@/services';
import logger from '@/utils/logger';

/**
 * Dashboard Page
 * Protected route - requires authentication
 */
function DashboardContent() {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      logger.debug('Signing out user');
      await signOut();
      router.push('/signin');
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
          }}
        >
          Welcome to Dashboard
        </Typography>

        <Card sx={{ mt: 4, borderRadius: `${brand.borderRadius * 1.5}px` }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              User Information
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" color="text.secondary" paragraph>
                <strong>Email:</strong> {user?.email}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                <strong>Display Name:</strong> {user?.displayName || 'Not set'}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                <strong>Email Verified:</strong>{' '}
                {user?.emailVerified ? 'Yes' : 'No'}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                <strong>User ID:</strong> {user?.uid}
              </Typography>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                onClick={handleSignOut}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: `${brand.borderRadius / 2}px`,
                }}
              >
                Sign Out
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard 
      requireAuth={true} 
      redirectTo="/signin"
      loadingText="Loading dashboard..."
    >
      <DashboardContent />
    </AuthGuard>
  );
}