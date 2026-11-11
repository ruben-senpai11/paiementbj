import { ServiceCategoryType } from '@paiementbj/types';

export const APP_INFO = {
  name: 'Paiement BJ',
  signature: 'Tous vos paiements, simplement.',
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
    label: 'Factures & Abonnements',
    description: 'Électricité (SBEE), eau (SONEB), télévision (CANAL+), Internet et recharges.',
    iconName: 'zap',
  },
  [ServiceCategoryType.PUBLIC_ADMINISTRATION]: {
    label: 'Démarches Publiques',
    description: 'Trésor public, impôts, timbres fiscaux, actes d’état civil ANIP et redevances.',
    iconName: 'landmark',
  },
  [ServiceCategoryType.GOODS_SERVICES]: {
    label: 'Biens & Services',
    description: 'Commerçants partenaires, entreprises certifiées et prestations de proximité.',
    iconName: 'shopping-bag',
  },
  [ServiceCategoryType.TRANSFERS]: {
    label: 'Transferts Interopérables',
    description: 'Passerelle entre opérateurs et banques via l’infrastructure nationale PI-SPI.',
    iconName: 'arrow-left-right',
  },
  [ServiceCategoryType.INTERNATIONAL]: {
    label: 'International & Diaspora',
    description: 'Paiements par cartes bancaires internationales pour la diaspora et les visiteurs.',
    iconName: 'globe',
  },
};

export const STANDARD_MESSAGES = {
  emptyTransactions: 'Aucune transaction pour le moment. Vos paiements effectués depuis Paiement BJ apparaîtront ici.',
  emptyServices: 'Aucun service disponible pour cette sélection actuellement.',
  serviceUnavailable: 'Ce service n’est pas encore disponible.',
  providerMaintenance: 'Le service rencontre actuellement une difficulté. Veuillez réessayer ultérieurement.',
  networkError: 'Vérifiez votre connexion Internet et réessayez.',
  noInternalWalletNotice: 'Paiement BJ n’est pas un portefeuille électronique et ne conserve aucun fonds. Vos transactions sont traitées directement par votre banque ou votre opérateur Mobile Money.',
  bceaoNotice: 'Conformément aux directives de la BCEAO et à l’Instruction n°001-01-2024, Paiement BJ opère exclusivement en intermédiation technique sans conservation ni émission de monnaie électronique.',
} as const;
