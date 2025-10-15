/**
 * Authentication components exports
 */

export { default as LogoHeader } from './LogoHeader';
export { default as AuthGuard } from './AuthGuard';
export { default as AdminGuard } from './AdminGuard';
export { default as AuthRedirect } from './AuthRedirect';
export { default as ReCaptcha } from './ReCaptcha';
export { default as SocialAuthButtons } from './SocialAuthButtons';
export { default as MFADialog } from './MFADialog';
export { PasswordStrengthBar, validatePassword } from './PasswordStrength';

export { default as SignInForm } from './SignInForm';
export { default as RegisterForm } from './RegisterForm';
export { default as ForgotPasswordForm } from './ForgotPasswordForm';
export { default as ConsentGate } from "./ConsentGate";