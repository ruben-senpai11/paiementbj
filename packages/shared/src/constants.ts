import { ServiceCategoryType } from '@paiementbj/types';

export const APP_INFO = {
  name: 'Paiement BJ',
  signature: 'Vos services publics et factures, en un seul endroit.',
  version: '1.0.0',
  country: 'Bénin',
  currency: 'XOF',
  currencySymbol: 'FCFA',
} as const;

export const CATEGORY_METADATA: Record<
  ServiceCategoryType,
  { label: string; description: string; iconName: string }
> = {
  [ServiceCategoryType.UTILITIES_BILLS]: {
    label: 'Factures & Eau',
    description: 'Électricité (SBEE), eau (SONEB), télévision et accès Internet.',
    iconName: 'zap',
  },
  [ServiceCategoryType.PUBLIC_ADMINISTRATION]: {
    label: 'Trésor & ANIP',
    description: 'Timbres fiscaux, impôts, actes d’état civil et redevances publiques.',
    iconName: 'landmark',
  },
  [ServiceCategoryType.GOODS_SERVICES]: {
    label: 'Biens & Services',
    description: 'Organismes partenaires et prestations de proximité.',
    iconName: 'shopping-bag',
  },
  [ServiceCategoryType.TRANSFERS]: {
    label: 'Transferts',
    description: 'Transferts interopérables entre opérateurs et banques.',
    iconName: 'arrow-left-right',
  },
  [ServiceCategoryType.INTERNATIONAL]: {
    label: 'Diaspora',
    description: 'Règlements par carte bancaire depuis l’étranger.',
    iconName: 'globe',
  },
};

export const STANDARD_MESSAGES = {
  emptyTransactions: 'Aucune opération enregistrée pour le moment.',
  emptyServices: 'Aucun service disponible pour cette sélection.',
  serviceUnavailable: 'Service momentanément indisponible.',
  providerMaintenance: 'Service momentanément indisponible. Réessayez ultérieurement.',
  networkError: 'Vérifiez votre connexion Internet et réessayez.',
  noInternalWalletNotice:
    'Règlement direct auprès de votre opérateur ou de votre banque.',
  bceaoNotice:
    'Intermédiation directe entre usagers, organismes publics et partenaires agréés.',
} as const;
