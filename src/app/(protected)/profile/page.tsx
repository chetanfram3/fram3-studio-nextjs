// src/app/(protected)/profile/page.tsx
'use client';

import { AuthGuard } from '@/components/auth';
import ProfileForm from '@/components/profile/ProfileForm';

/**
 * Profile Page
 * Protected route - requires authentication
 */
export default function ProfilePage() {
  return (
    <AuthGuard 
      requireAuth={true} 
      redirectTo="/signin"
      loadingText="Loading profile..."
    >
      <ProfileForm />
    </AuthGuard>
  );
}