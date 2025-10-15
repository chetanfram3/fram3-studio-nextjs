import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { User } from 'firebase/auth';

interface TokenClaims {
  access_level: string;
  subscription: string;
  is_enabled: boolean;
  isNewUser: boolean;
}

const extractTokenClaims = (user: User | null): TokenClaims | null => {
  try {
    const userWithToken = user as User & {
      stsTokenManager?: {
        accessToken?: string;
      };
    };

    if (!userWithToken?.stsTokenManager?.accessToken) {
      return null;
    }

    const payload = userWithToken.stsTokenManager.accessToken.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));

    return {
      access_level: decodedPayload.access_level,
      subscription: decodedPayload.subscription,
      is_enabled: decodedPayload.is_enabled,
      isNewUser: decodedPayload.isNewUser ?? true,
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