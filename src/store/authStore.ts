// authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from 'firebase/auth';

interface TokenClaims {
  access_level: string;
  subscription: string;
  is_enabled: boolean;
}

interface AuthState {
  // Auth state
  user: User | null;
  claims: TokenClaims | null;
  loading: boolean;
  error: string | null;
  profileLoaded: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setClaims: (claims: TokenClaims | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProfileLoaded: (loaded: boolean) => void;
  logout: () => void;
  reset: () => void; // Add reset action to interface
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      claims: null,
      loading: true,
      error: null,
      profileLoaded: false,

      // Actions
      setUser: (user) => set({ user }),
      setClaims: (claims) => set({ claims }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setProfileLoaded: (loaded) => set({ profileLoaded: loaded }),
      logout: () => set({
        user: null,
        claims: null,
        profileLoaded: false,
        error: null
      }),
      reset: () => set({ // Add reset implementation
        user: null,
        claims: null,
        loading: true,
        error: null,
        profileLoaded: false
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist user and claims, not loading/error states
        user: state.user,
        claims: state.claims,
      }),
    }
  )
);