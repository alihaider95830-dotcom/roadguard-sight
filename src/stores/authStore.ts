import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Operator } from '@/types';

interface AuthState {
  user: Operator | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setUser: (user: Operator, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            return { success: false, error: data.error || 'Login failed' };
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (err) {
          return { success: false, error: 'Network error. Is the backend running?' };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: Operator, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'atis-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
