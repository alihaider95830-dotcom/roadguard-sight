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

// Mock users for demonstration
const mockUsers: Record<string, { password: string; user: Operator }> = {
  'admin@atis.com': {
    password: 'admin123',
    user: {
      operatorId: 1,
      name: 'Admin User',
      email: 'admin@atis.com',
      role: 'Admin',
      enabled: true,
      createdAt: '2024-01-01T00:00:00Z',
    },
  },
  'operator@atis.com': {
    password: 'operator123',
    user: {
      operatorId: 2,
      name: 'John Operator',
      email: 'operator@atis.com',
      role: 'Operator',
      enabled: true,
      createdAt: '2024-01-15T00:00:00Z',
    },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const mockUser = mockUsers[email.toLowerCase()];
        
        if (!mockUser) {
          return { success: false, error: 'User not found' };
        }

        if (mockUser.password !== password) {
          return { success: false, error: 'Invalid password' };
        }

        if (!mockUser.user.enabled) {
          return { success: false, error: 'Account is disabled' };
        }

        const token = `mock-jwt-token-${Date.now()}`;
        
        set({
          user: mockUser.user,
          token,
          isAuthenticated: true,
        });

        return { success: true };
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
