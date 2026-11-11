import React from 'react';

export const PaiementBjSquircleIcon: React.FC<{ size?: number }> = ({ size = 88 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 112 112"
    fill="none"
    role="img"
    aria-label="Icône de l’application Paiement BJ"
  >
    <rect width="112" height="112" rx="26" fill="#064B32" />
    <rect
      x="1.5"
      y="1.5"
      width="109"
      height="109"
      rx="24.5"
      stroke="rgba(255,255,255,0.14)"
      strokeWidth="3"
    />
    {/* Tricolore béninois épuré */}
    <rect x="24" y="25" width="21" height="8" rx="2" fill="#008751" />
    <rect x="45" y="25" width="22" height="8" fill="#FCD116" />
    <rect x="67" y="25" width="21" height="8" rx="2" fill="#E8112D" />
    {/* Barre principale carte de paiement */}
    <rect x="24" y="45" width="64" height="16" rx="5" fill="#FFFFFF" />
    {/* Accentuation solaire */}
    <rect x="24" y="69" width="42" height="13" rx="5" fill="#FFC52C" />
    <circle cx="80" cy="75.5" r="6.5" fill="#34A853" />
  </svg>
);

export const GooglePlayPrismIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M3.61 1.814L13.793 12 3.61 22.186a1.75 1.75 0 0 1-.61-1.34V3.154c0-.517.224-.998.61-1.34z"
    />
    <path
      fill="#34A853"
      d="M17.167 8.626L13.793 12l3.374 3.374 3.816-2.16c.83-.47.83-1.958 0-2.428l-3.816-2.16z"
    />
    <path
      fill="#FBBC04"
      d="M13.793 12L3.61 22.186c.35.302.838.404 1.33.126l12.227-6.938L13.793 12z"
    />
    <path
      fill="#EA4335"
      d="M17.167 8.626L4.94 1.688c-.492-.278-.98-.176-1.33.126L13.793 12l3.374-3.374z"
    />
  </svg>
);

export const AppleStoreIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.365 12.64c-.02-2.083 1.7-3.084 1.777-3.133-.972-1.42-2.482-1.614-3.014-1.636-1.268-.13-2.495.758-3.142.758-.658 0-1.652-.742-2.724-.72-1.387.02-2.68.822-3.395 2.073-1.463 2.536-.372 6.272 1.034 8.323.702 1.004 1.524 2.126 2.601 2.086 1.052-.043 1.448-.674 2.718-.674 1.26 0 1.63.674 2.727.649 1.132-.018 1.843-1.01 2.523-2.022.809-1.174 1.135-2.326 1.149-2.385-.026-.011-2.19-.841-2.214-3.319zM14.303 6.535c.565-.701.953-1.658.847-2.635-.819.035-1.842.556-2.428 1.242-.517.602-.979 1.594-.858 2.528.918.07 1.863-.449 2.439-1.135z" />
  </svg>
);

export const VerifiedBadgeIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2L4.5 5.3v5.9c0 5.1 3.2 9.8 7.5 11.3 4.3-1.5 7.5-6.2 7.5-11.3V5.3L12 2z"
      fill="#00573B"
    />
    <path
      d="M9.4 12.2l1.8 1.8 3.8-4"
      stroke="#FFFFFF"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const UnifiedLayersIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3L3 8l9 5 9-5-9-5z"
      stroke="#00573B"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path
      d="M3 13l9 5 9-5"
      stroke="#004A99"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 17.5l9 4.5 9-4.5"
      stroke="#00573B"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const NoWalletShieldIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="6" width="18" height="13" rx="3" stroke="#004A99" strokeWidth="1.9" />
    <path d="M3 10.5h18" stroke="#00573B" strokeWidth="1.9" />
    <circle cx="16.5" cy="14.75" r="1.4" fill="#00573B" />
  </svg>
);

export const ReceiptVerifiedIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"
      stroke="#00573B"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 11l1.8 1.8 3.5-3.8"
      stroke="#004A99"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WebGlobeIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" />
    <path d="M3.6 9h16.8M3.6 15h16.8" stroke="currentColor" strokeWidth="1.7" />
    <ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);
