import { PaiementBjApiClient } from '@paiementbj/api-client';
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/v1';

export const api = new PaiementBjApiClient({
  baseUrl: BASE_URL,
  getToken: async () => {
    return useAuthStore.getState().token;
  },
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});
