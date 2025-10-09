import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import AuthRedirect from "@/components/auth/AuthRedirect";
/**
 * Forgot Password Page
 * Public route - redirects to dashboard if already authenticated
 */
export default function ForgotPasswordPage() {
  return (
    <AuthRedirect redirectTo="/profile">
      <ForgotPasswordForm />
    </AuthRedirect>
  );
}
