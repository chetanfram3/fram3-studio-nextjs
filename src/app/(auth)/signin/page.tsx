import { AuthGuard, SignInForm } from '@/components/auth';

/**
 * Sign In Page
 * Public route - redirects to dashboard if already authenticated
 */
export default function SignInPage() {
  return (
    <AuthGuard 
      requireAuth={false} 
      redirectIfAuthenticated="/dashboard"
      loadingText="Loading..."
    >
      <SignInForm />
    </AuthGuard>
  );
}