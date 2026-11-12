export interface DistributionConfig {
  appName: string;
  tagline: string;
  publisher: string;
  version: string;
  packageId: string;
  playStoreUrl: string | null;
  appStoreUrl: string | null;
  webAppUrl: string;
  apiBaseUrl: string;
}

function normalizeUrl(raw: string | undefined): string | null {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export const DISTRIBUTION_CONFIG: DistributionConfig = {
  appName: 'Paiement BJ',
  tagline: 'Payez vos services publics et factures en un seul geste.',
  publisher: 'République du Bénin · Paiement BJ',
  version: '1.0.0',
  packageId: 'bj.paiement.app',
  playStoreUrl: normalizeUrl(import.meta.env.VITE_PLAY_STORE_URL),
  appStoreUrl: normalizeUrl(import.meta.env.VITE_APP_STORE_URL),
  webAppUrl: normalizeUrl(import.meta.env.VITE_WEB_APP_URL) || '/app',
  apiBaseUrl: normalizeUrl(import.meta.env.VITE_API_BASE_URL) || '/v1',
};
