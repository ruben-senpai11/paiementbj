export type PaymentProviderCode =
  | 'MTN_MOMO'
  | 'MOOV_MONEY'
  | 'CELTIIS_CASH'
  | 'BANK_CARD'
  | 'TRESOR_PAY';

export interface ProviderCapabilities {
  directDebit: boolean;
  hostedCheckout: boolean;
  qrCode: boolean;
  webhookNotification: boolean;
  refundSupport: boolean;
  statusQuery: boolean;
  currencyConversion: boolean;
}

export type ProviderAvailability = 'OPERATIONAL' | 'MAINTENANCE' | 'DEGRADED' | 'UNAVAILABLE';

export interface PaymentQuote {
  serviceId: string;
  providerCode: PaymentProviderCode;
  amountPrincipal: number; // Montant principal en FCFA (XOF)
  providerFee: number;     // Frais facturés par l'opérateur
  platformFee: number;     // Frais d'interopérabilité (0 par défaut)
  totalAmount: number;     // Montant total débité
  currency: 'XOF' | 'EUR' | 'USD';
  exchangeRate?: number;   // Si devise étrangère
  expiresAt: string;
}

export interface PaymentSessionRequest {
  paymentIntentId: string;
  amount: number;
  currency: 'XOF' | 'EUR' | 'USD';
  customerPhone: string;
  serviceReference: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentSessionResponse {
  sessionId: string;
  providerReference: string;
  status: 'PENDING' | 'REDIRECT_REQUIRED' | 'CHALLENGE_REQUIRED' | 'FAILED';
  redirectUrl?: string;
  qrCodeData?: string;
  instructions?: string;
}

export interface ProviderStatusCheckResponse {
  providerReference: string;
  isConfirmed: boolean;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  rawResponseCode?: string;
  settledAt?: string;
  failureReason?: string;
}

export interface ProviderSummary {
  code: PaymentProviderCode;
  name: string;
  capabilities: ProviderCapabilities;
  availability: ProviderAvailability;
  statusMessage?: string;
  brandAssetKey: string;
}

export interface PaymentValidationResult {
  isValid: boolean;
  providerCode: PaymentProviderCode;
  serviceId: string;
  serviceReference: string;
  customerName?: string;
  accountStatus?: string;
  outstandingAmount?: number;
  message: string;
}
