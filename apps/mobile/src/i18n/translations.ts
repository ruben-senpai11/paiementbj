import { AppLanguage } from '../store/useSettingsStore';

export const translations = {
  fr: {
    appName: 'Paiement BJ',
    tagline: 'Tous vos paiements, simplement.',
    countryBadge: 'RÉPUBLIQUE DU BÉNIN',
    tabs: {
      home: 'Accueil',
      services: 'Services',
      activity: 'Activité',
      profile: 'Profil',
    },
    headers: {
      services: 'Catalogue des Services',
      activity: 'Historique des Paiements',
      profile: 'Mon Compte & Sécurité',
    },
    home: {
      searchPlaceholder: 'Rechercher électricité, eau, timbre, NPI...',
      connectedPrefix: 'Compte connecté :',
      level1Short: 'Niveau 1 vérifié',
      catUtilities: 'Factures & Eau',
      catPublic: 'Trésor & ANIP',
      catTransfers: 'Transferts',
      catDiaspora: 'Diaspora',
      popularTitle: 'Services les plus demandés',
      seeAll: 'Tout voir',
      recentTitle: 'Dernières opérations',
      fullHistory: 'Historique complet',
      emptyTitle: 'Aucune transaction pour le moment',
      regulationTitle: 'SÉCURITÉ DES FONDS & RÉGLEMENTATION BCEAO',
    },
    profile: {
      guestTitle: 'Profil Citoyen',
      guestDesc:
        'Connectez-vous pour gérer vos préférences, vos appareils autorisés et le niveau d’identification de votre compte.',
      loginCta: 'Se connecter',
      levelBadge: 'Niveau 1 : Téléphone vérifié',
      identitySection: 'IDENTIFICATION & SÉCURITÉ',
      identityRow: 'Identité ANIP & consentements APDP',
      devicesRow: 'Appareils connectés & sessions',
      settingsRow: 'Langue, accessibilité & confidentialité',
      supportSection: 'ASSISTANCE & LITIGES',
      supportRow: 'Centre de réclamations & support usager',
      faqRow: 'Foire Aux Questions (FAQ)',
      complianceSection: 'CONFORMITÉ & PROTECTION DES DONNÉES',
      apdpNotice:
        'Conforme au Code du Numérique du Bénin et à la Loi APDP n°2017-20 relative à la protection des données personnelles.',
      bceaoNotice:
        'Conforme à l’Instruction BCEAO n°001-01-2024 : Paiement BJ n’émet aucune monnaie électronique et ne gère aucun compte de cantonnement propre.',
      logoutConfirmTitle: 'Déconnexion',
      logoutConfirmBody: 'Êtes-vous certain de vouloir fermer votre session sur cet appareil ?',
    },
    common: {
      connect: 'Se connecter avec son numéro de téléphone',
      exploreServices: 'Découvrir les services',
      logout: 'Fermer la session',
    },
  },
  en: {
    appName: 'Paiement BJ',
    tagline: 'All your payments, simply.',
    countryBadge: 'REPUBLIC OF BENIN',
    tabs: {
      home: 'Home',
      services: 'Services',
      activity: 'Activity',
      profile: 'Profile',
    },
    headers: {
      services: 'Service Catalog',
      activity: 'Payment History',
      profile: 'Account & Security',
    },
    home: {
      searchPlaceholder: 'Search electricity, water, stamp, NPI...',
      connectedPrefix: 'Signed in as:',
      level1Short: 'Level 1 verified',
      catUtilities: 'Bills & Water',
      catPublic: 'Treasury & ANIP',
      catTransfers: 'Transfers',
      catDiaspora: 'Diaspora',
      popularTitle: 'Most requested services',
      seeAll: 'See all',
      recentTitle: 'Recent operations',
      fullHistory: 'Full history',
      emptyTitle: 'No transactions yet',
      regulationTitle: 'FUNDS SECURITY & BCEAO COMPLIANCE',
    },
    profile: {
      guestTitle: 'Citizen Profile',
      guestDesc:
        'Sign in to manage your preferences, authorized devices, and identity verification level.',
      loginCta: 'Sign in',
      levelBadge: 'Level 1: Verified phone',
      identitySection: 'IDENTITY & SECURITY',
      identityRow: 'ANIP identity & APDP consents',
      devicesRow: 'Connected devices & active sessions',
      settingsRow: 'Language, accessibility & privacy',
      supportSection: 'SUPPORT & DISPUTES',
      supportRow: 'Disputes & user support center',
      faqRow: 'Frequently Asked Questions (FAQ)',
      complianceSection: 'COMPLIANCE & DATA PROTECTION',
      apdpNotice:
        'Compliant with Benin Digital Code and APDP Law No. 2017-20 on personal data protection.',
      bceaoNotice:
        'Compliant with BCEAO Instruction No. 001-01-2024: Paiement BJ issues no e-money and holds no internal escrow wallet.',
      logoutConfirmTitle: 'Sign out',
      logoutConfirmBody: 'Are you sure you want to close your session on this device?',
    },
    common: {
      connect: 'Sign in with your phone number',
      exploreServices: 'Explore services',
      logout: 'Sign out',
    },
  },
} as const;

export function getTranslations(lang: AppLanguage) {
  return translations[lang] || translations.fr;
}
