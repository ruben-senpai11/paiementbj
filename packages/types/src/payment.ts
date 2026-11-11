import { PaymentProviderCode } from './provider';

export type TransactionStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface PaymentIntent {
  id: string;
  reference: string;
  userId: string;
  serviceId: string;
  amountPrincipal: number;
  providerFee: number;
  totalAmount: number;
  currency: 'XOF' | 'EUR' | 'USD';
  serviceReference: string;
  customerData: Record<string, string>;
  status: TransactionStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
}

export interface PaymentAttempt {
  id: string;
  paymentIntentId: string;
  providerCode: PaymentProviderCode;
  providerReference?: string;
  status: TransactionStatus;
  rawStatus?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEvent {
  id: string;
  paymentIntentId: string;
  eventType: string; // 'intent_created', 'attempt_started', 'webhook_received', 'status_polled', 'confirmed'
  fromStatus?: TransactionStatus;
  toStatus: TransactionStatus;
  payload?: Record<string, unknown>;
  createdAt: string;
}
