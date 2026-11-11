export enum ServiceCategoryType {
  UTILITIES_BILLS = 'UTILITIES_BILLS',
  PUBLIC_ADMINISTRATION = 'PUBLIC_ADMINISTRATION',
  GOODS_SERVICES = 'GOODS_SERVICES',
  TRANSFERS = 'TRANSFERS',
  INTERNATIONAL = 'INTERNATIONAL',
}

export type IntegrationStatus =
  | 'LIVE'
  | 'SANDBOX_CONNECTED'
  | 'PENDING_AGREEMENT'
  | 'TECHNICAL_IN_PROGRESS'
  | 'UNAVAILABLE';

export interface ServiceField {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number' | 'phone' | 'reference' | 'npi' | 'select';
  required: boolean;
  validationRegex?: string;
  options?: Array<{ label: string; value: string }>;
  helpText?: string;
  minLength?: number;
  maxLength?: number;
}

export interface ServiceOrganization {
  id: string;
  code: string; // Ex: 'sbee', 'soneb', 'tresor', 'anip', 'canal_plus'
  name: string;
  description: string;
  category: ServiceCategoryType;
  logoAssetKey: string;
  websiteUrl?: string;
  supportPhone?: string;
  isPublicEntity: boolean;
}

export interface ServiceItem {
  id: string;
  organizationId: string;
  organization?: ServiceOrganization;
  code: string;
  title: string;
  description: string;
  category: ServiceCategoryType;
  integrationStatus: IntegrationStatus;
  statusMessage?: string;
  minAmount?: number;
  maxAmount?: number;
  currency: 'XOF' | 'EUR' | 'USD';
  requiredIdentityLevel: 'LEVEL_1_PHONE_VERIFIED' | 'LEVEL_2_IDENTITY_VERIFIED' | 'LEVEL_3_ENHANCED';
  supportedPaymentMethods: Array<'MTN_MOMO' | 'MOOV_MONEY' | 'CELTIIS_CASH' | 'BANK_CARD' | 'BANK_TRANSFER'>;
  fields: ServiceField[];
  fixedFee?: number;
  percentageFee?: number;
}
