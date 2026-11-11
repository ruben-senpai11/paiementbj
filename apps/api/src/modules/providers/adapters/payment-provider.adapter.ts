import {
  PaymentProviderCode,
  ProviderCapabilities,
  ProviderAvailability,
  PaymentQuote,
  PaymentSessionRequest,
  PaymentSessionResponse,
  PaymentValidationResult,
  ProviderStatusCheckResponse,
} from '@paiementbj/types';

export interface WebhookVerificationOutcome {
  valid: boolean;
  providerReference: string;
  isConfirmed: boolean;
  rawStatus: string;
  reason?: string;
}

export interface PaymentProviderAdapter {
  readonly code: PaymentProviderCode;
  readonly name: string;

  getCapabilities(): ProviderCapabilities;

  getAvailability(): Promise<{
    status: ProviderAvailability;
    message?: string;
  }>;

  validatePayment(request: {
    serviceId: string;
    serviceReference: string;
    amount?: number;
  }): Promise<PaymentValidationResult>;

  getPaymentQuote(
    serviceId: string,
    amount: number,
    currency?: 'XOF' | 'EUR' | 'USD'
  ): Promise<PaymentQuote>;

  createPaymentSession(
    request: PaymentSessionRequest
  ): Promise<PaymentSessionResponse>;

  verifyPaymentStatus(
    providerReference: string
  ): Promise<ProviderStatusCheckResponse>;

  handleVerifiedWebhook?(
    headers: Record<string, string | string[] | undefined>,
    rawPayload: string,
    parsedPayload: Record<string, unknown>
  ): Promise<WebhookVerificationOutcome>;

  initiateRefund?(
    providerReference: string,
    amount: number,
    reason: string
  ): Promise<{ refundReference: string; success: boolean }>;
}
