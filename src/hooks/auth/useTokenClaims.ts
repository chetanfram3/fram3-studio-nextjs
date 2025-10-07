import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface TokenClaims {
  access_level: string;
  subscription: string;
  is_enabled: boolean;
}

const extractTokenClaims = (user: any): TokenClaims | null => {
  try {
    if (!user?.stsTokenManager?.accessToken) {
      return null;
    }

    const payload = user.stsTokenManager.accessToken.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));

    return {
      access_level: decodedPayload.access_level,
      subscription: decodedPayload.subscription,
      is_enabled: decodedPayload.is_enabled,
    };
  } catch (error) {
    console.error('Error extracting token claims:', error);
    return null;
  }
};

export function useTokenClaims() {
  const { user, claims, setClaims } = useAuthStore();

  useEffect(() => {
    if (user) {
      const extractedClaims = extractTokenClaims(user);
      if (extractedClaims && JSON.stringify(extractedClaims) !== JSON.stringify(claims)) {
        setClaims(extractedClaims);
      }
    } else {
      setClaims(null);
    }
  }, [user, setClaims, claims]);

  return claims;
}