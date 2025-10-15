// src/app/(protected)/profile/page.tsx
"use client";

import ProfileForm from "@/components/profile/ProfileForm";

/**
 * Profile Page
 * Protected route - requires authentication
 */
export default function ProfilePage() {
  return <ProfileForm />;
}
