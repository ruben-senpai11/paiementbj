import { PaiementBjApiClient } from '@paiementbj/api-client';
import { AdminUserInfo } from '@paiementbj/types';

const TOKEN_STORAGE_KEY = 'paiementbj_admin_token';
const USER_STORAGE_KEY = 'paiementbj_admin_user';

const envBase =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL;
export const ADMIN_API_BASE = envBase || 'http://localhost:4000/v1';

let unauthorizedHandler: (() => void) | null = null;

export function registerAdminUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

export function getStoredAdminSession(): {
  token: string | null;
  admin: AdminUserInfo | null;
} {
  try {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    const rawUser = sessionStorage.getItem(USER_STORAGE_KEY);
    const admin = rawUser ? (JSON.parse(rawUser) as AdminUserInfo) : null;
    return { token, admin };
  } catch {
    return { token: null, admin: null };
  }
}

export function saveAdminSession(token: string, admin: AdminUserInfo): void {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(admin));
  } catch {
    // Ignore si sessionStorage est restreint
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export const adminApi = new PaiementBjApiClient({
  baseUrl: ADMIN_API_BASE,
  getToken: async () => getStoredAdminSession().token,
  onUnauthorized: () => {
    clearAdminSession();
    unauthorizedHandler?.();
  },
});
