import { TransactionStatus } from './payment';
import { PaymentProviderCode } from './provider';

export interface TransactionSummary {
  id: string;
  reference: string; // Ex: "PBJ-20261110-84729"
  serviceCode: string;
  serviceTitle: string;
  beneficiaryName: string;
  organizationLogoKey: string;
  amountPrincipal: number;
  providerFee: number;
  totalAmount: number;
  currency: 'XOF' | 'EUR' | 'USD';
  providerCode: PaymentProviderCode;
  providerReference?: string;
  status: TransactionStatus;
  statusLabel: string;
  initiatedAt: string;
  confirmedAt?: string;
  receiptId?: string;
  serviceReference: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string; // "REC-BJ-2026-XXXXX"
  transactionId: string;
  beneficiaryName: string;
  serviceTitle: string;
  serviceReference: string;
  amountPrincipal: number;
  fees: number;
  totalAmount: number;
  currency: 'XOF' | 'EUR' | 'USD';
  payerPhone: string;
  providerName: string;
  providerReference: string;
  issuedAt: string;
  digitalSignatureHash: string;
  isVerified: boolean;
}
