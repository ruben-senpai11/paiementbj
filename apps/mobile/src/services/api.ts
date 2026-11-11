import { PaiementBjApiClient } from '@paiementbj/api-client';
import { useAuthStore } from '../store/useAuthStore';

function resolveApiBaseUrl(): string {
  const configured = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.location) {
    const { hostname, protocol, pathname, port } = window.location;
    const mountedViaGateway = pathname === '/app' || pathname.startsWith('/app/');
    if (
      protocol.startsWith('http') &&
      hostname &&
      ((hostname !== 'localhost' && hostname !== '127.0.0.1') ||
        (mountedViaGateway && port !== '4101'))
    ) {
      return '/v1';
    }
  }
  return 'http://localhost:4000/v1';
}

const BASE_URL = resolveApiBaseUrl();

export const api = new PaiementBjApiClient({
  baseUrl: BASE_URL,
  getToken: async () => {
    return useAuthStore.getState().token;
  },
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});
