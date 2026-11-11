/**
 * Mapping officiel des logos de marque téléchargés localement.
 * Aucun chargement distant à l'exécution : résilience, sécurité et performance.
 */

export interface BrandAssetDefinition {
  key: string;
  brandName: string;
  altText: string;
  fallbackText: string;
  localPath: string;
  backgroundColor: string;
}

export const BRAND_ASSETS: Record<string, BrandAssetDefinition> = {
  mtn: {
    key: 'mtn',
    brandName: 'MTN Bénin',
    altText: 'Logo officiel de MTN Bénin',
    fallbackText: 'MTN',
    localPath: 'assets/brands/mtn/mtn-logo-2022.svg',
    backgroundColor: '#FFCC00',
  },
  mtnMoMo: {
    key: 'mtnMoMo',
    brandName: 'MTN Mobile Money',
    altText: 'Logo officiel MTN MoMo',
    fallbackText: 'MoMo',
    localPath: 'assets/brands/mtn-momo/mtn-momo-logo.png',
    backgroundColor: '#FFCC00',
  },
  moov: {
    key: 'moov',
    brandName: 'Moov Africa Bénin',
    altText: 'Logo officiel Moov Africa Bénin',
    fallbackText: 'Moov',
    localPath: 'assets/brands/moov-africa/moov-africa-logo.png',
    backgroundColor: '#FFFFFF',
  },
  moovMoney: {
    key: 'moovMoney',
    brandName: 'Moov Money Bénin',
    altText: 'Logo officiel Moov Money Bénin',
    fallbackText: 'Moov Money',
    localPath: 'assets/brands/moov-money/moov-money-logo.png',
    backgroundColor: '#0055A5',
  },
  celtiis: {
    key: 'celtiis',
    brandName: 'Celtiis Bénin',
    altText: 'Logo officiel Celtiis Bénin',
    fallbackText: 'Celtiis',
    localPath: 'assets/brands/celtiis/celtiis-logo.png',
    backgroundColor: '#FFFFFF',
  },
  celtiisCash: {
    key: 'celtiisCash',
    brandName: 'Celtiis Cash Bénin',
    altText: 'Logo officiel Celtiis Cash',
    fallbackText: 'Celtiis Cash',
    localPath: 'assets/brands/celtiis-cash/celtiis-cash-logo.png',
    backgroundColor: '#FFFFFF',
  },
  sbee: {
    key: 'sbee',
    brandName: 'SBEE (Société Béninoise d’Énergie Électrique)',
    altText: 'Logo officiel de la SBEE',
    fallbackText: 'SBEE',
    localPath: 'assets/brands/sbee/sbee-logo.webp',
    backgroundColor: '#FFFFFF',
  },
  soneb: {
    key: 'soneb',
    brandName: 'SONEB (Société Nationale des Eaux du Bénin)',
    altText: 'Logo officiel de la SONEB',
    fallbackText: 'SONEB',
    localPath: 'assets/brands/soneb/soneb-logo.png',
    backgroundColor: '#FFFFFF',
  },
  canal: {
    key: 'canal',
    brandName: 'CANAL+ Bénin',
    altText: 'Logo officiel CANAL+',
    fallbackText: 'CANAL+',
    localPath: 'assets/brands/canal-plus/canal-plus-logo.png',
    backgroundColor: '#000000',
  },
  tresor: {
    key: 'tresor',
    brandName: 'Trésor Public du Bénin',
    altText: 'Emblème officiel du Trésor Public Bénin',
    fallbackText: 'Trésor Public',
    localPath: 'assets/brands/tresor/tresor-logo.jpg',
    backgroundColor: '#FFFFFF',
  },
  anip: {
    key: 'anip',
    brandName: 'ANIP (Identification des Personnes)',
    altText: 'Logo officiel de l’ANIP République du Bénin',
    fallbackText: 'ANIP',
    localPath: 'assets/brands/anip/anip-logo.png',
    backgroundColor: '#FFFFFF',
  },
  visa: {
    key: 'visa',
    brandName: 'Visa',
    altText: 'Logo officiel Visa',
    fallbackText: 'Visa',
    localPath: 'assets/brands/visa/visa-logo.svg',
    backgroundColor: '#FFFFFF',
  },
  mastercard: {
    key: 'mastercard',
    brandName: 'Mastercard',
    altText: 'Logo officiel Mastercard',
    fallbackText: 'Mastercard',
    localPath: 'assets/brands/mastercard/mastercard-logo.svg',
    backgroundColor: '#FFFFFF',
  },
};
