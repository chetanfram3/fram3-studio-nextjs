import RegisterForm from "@/components/auth/RegisterForm";
import AuthRedirect from "@/components/auth/AuthRedirect";

/**
 * Register Page
 * Public route - redirects to dashboard if already authenticated
 */
export default function RegisterPage() {
  return (
    <AuthRedirect redirectTo="/profile">
      <RegisterForm />
    </AuthRedirect>
  );
}
