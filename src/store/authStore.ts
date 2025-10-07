'use client';

import { create } from 'zustand';
import { AuthState } from '@/types/auth';
import { User as FirebaseUser } from 'firebase/auth';

/**
 * Global authentication store
 * Manages user authentication state across the application
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  profileLoaded: false,
  
  setUser: (user: FirebaseUser | null) => 
    set({ user }),
  
  setLoading: (loading: boolean) => 
    set({ loading }),
  
  setError: (error: string | null) => 
    set({ error }),
  
  setProfileLoaded: (loaded: boolean) => 
    set({ profileLoaded: loaded }),
  
  reset: () => 
    set({
      user: null,
      loading: false,
      error: null,
      profileLoaded: false,
    }),
}));