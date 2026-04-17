import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

const storage = {
  getItem: async (name: string) => {
    return (await SecureStore.getItemAsync(name)) || null;
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface User {
  id: string;
  email: string;
  nickname?: string;
  avatar?: string;
  profile?: any;
  subscription?: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (user, token) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);

interface ProfileState {
  profile: any | null;
  setProfile: (profile: any) => void;
  updateProfile: (updates: Partial<any>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : updates,
        })),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);

interface AppState {
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboardingCompleted: false,
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      selectedDate: new Date(),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);

// Redux-style store for complex state if needed
export { useAuthStore, useProfileStore, useAppStore };
