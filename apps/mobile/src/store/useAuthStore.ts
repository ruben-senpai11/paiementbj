import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User } from '@paiementbj/types';

const TOKEN_STORAGE_KEY = 'paiementbj_access_token';
const USER_STORAGE_KEY = 'paiementbj_user_profile';
const DEVICE_ID_KEY = 'paiementbj_device_id';

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
    return null;
  }
  return await SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await secureGet(DEVICE_ID_KEY);
    if (existing) return existing;
    const generated =
      typeof globalThis.crypto?.randomUUID === 'function'
        ? `dev_${globalThis.crypto.randomUUID()}`
        : `dev_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    await secureSet(DEVICE_ID_KEY, generated);
    return generated;
  } catch {
    return 'dev_default_mobile';
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hydrateAuth: () => Promise<void>;
  setAuth: (user: User, token: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  hydrateAuth: async () => {
    try {
      const [token, rawUser] = await Promise.all([
        secureGet(TOKEN_STORAGE_KEY),
        secureGet(USER_STORAGE_KEY),
      ]);
      if (token && rawUser) {
        const parsedUser = JSON.parse(rawUser) as User;
        set({
          token,
          user: parsedUser,
          isAuthenticated: true,
          isHydrated: true,
        });
        return;
      }
    } catch {
      // État propre non connecté si lecture impossible
    }
    set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
  },

  setAuth: async (user, token) => {
    try {
      await Promise.all([
        secureSet(TOKEN_STORAGE_KEY, token),
        secureSet(USER_STORAGE_KEY, JSON.stringify(user)),
      ]);
    } catch {
      // Garde l'état en mémoire même si SecureStore est indisponible
    }
    set({
      user,
      token,
      isAuthenticated: true,
      isHydrated: true,
    });
  },

  updateUser: async (user) => {
    try {
      await secureSet(USER_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Tolérance erreur stockage
    }
    set({ user });
  },

  logout: async () => {
    try {
      await Promise.all([secureDelete(TOKEN_STORAGE_KEY), secureDelete(USER_STORAGE_KEY)]);
    } catch {
      // Tolérance erreur suppression
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));
