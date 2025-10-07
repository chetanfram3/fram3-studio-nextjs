import { AuthGuard, ForgotPasswordForm } from '@/components/auth';

/**
 * Forgot Password Page
 * Public route - redirects to dashboard if already authenticated
 */
export default function ForgotPasswordPage() {
  return (
    <AuthGuard 
      requireAuth={false} 
      redirectIfAuthenticated="/dashboard"
      loadingText="Loading..."
    >
      <ForgotPasswordForm />
    </AuthGuard>
  );
}