import AuthRedirect from "@/components/auth/AuthRedirect";
import SignInForm from "@/components/auth/SignInForm";

/**
 * Sign In Page
 * Public route - redirects to dashboard if already authenticated
 */
export default function SignInPage() {
  return (
    <AuthRedirect redirectTo="/dashboard">
      <SignInForm />
    </AuthRedirect>
  );
}
