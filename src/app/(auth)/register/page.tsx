import { AuthGuard, RegisterForm } from '@/components/auth';

/**
 * Register Page
 * Public route - redirects to dashboard if already authenticated
 */
export default function RegisterPage() {
  return (
    <AuthGuard 
      requireAuth={false} 
      redirectIfAuthenticated="/dashboard"
      loadingText="Loading..."
    >
      <RegisterForm />
    </AuthGuard>
  );
}