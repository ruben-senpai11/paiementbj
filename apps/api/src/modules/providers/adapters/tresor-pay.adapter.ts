import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
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
import {
  PaymentProviderAdapter,
  WebhookVerificationOutcome,
} from './payment-provider.adapter';
import { verifyHmacWebhook } from '../webhook-signature.util';

@Injectable()
export class TresorPayAdapter implements PaymentProviderAdapter {
  readonly code: PaymentProviderCode = 'TRESOR_PAY';
  readonly name = 'Télépaiement Trésor Public';

  private isConfigured(): boolean {
    return Boolean(process.env.TRESOR_PUBLIC_API_KEY);
  }

  getCapabilities(): ProviderCapabilities {
    return {
      directDebit: false,
      hostedCheckout: true,
      qrCode: true,
      webhookNotification: true,
      refundSupport: false,
      statusQuery: true,
      currencyConversion: false,
    };
  }

  async getAvailability(): Promise<{ status: ProviderAvailability; message?: string }> {
    if (!this.isConfigured()) {
      return {
        status: 'UNAVAILABLE',
        message: 'Passerelle Trésor Public en attente de convention formelle MEF / DGTCP.',
      };
    }
    return {
      status: 'OPERATIONAL',
      message: 'Passerelle Trésor Pay opérationnelle.',
    };
  }

  async validatePayment(request: {
    serviceId: string;
    serviceReference: string;
  }): Promise<PaymentValidationResult> {
    if (!this.isConfigured()) {
      return {
        isValid: false,
        providerCode: this.code,
        serviceId: request.serviceId,
        serviceReference: request.serviceReference,
        message: 'Validation préalable indisponible : convention DGTCP / Trésor Pay requise.',
      };
    }
    return {
      isValid: request.serviceReference.trim().length >= 3,
      providerCode: this.code,
      serviceId: request.serviceId,
      serviceReference: request.serviceReference.trim(),
      message: 'Référence vérifiée pour émission de session Trésor Pay.',
    };
  }

  async getPaymentQuote(
    serviceId: string,
    amount: number,
    currency: 'XOF' | 'EUR' | 'USD' = 'XOF'
  ): Promise<PaymentQuote> {
    return {
      serviceId,
      providerCode: this.code,
      amountPrincipal: amount,
      providerFee: 0,
      platformFee: 0,
      totalAmount: amount,
      currency,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async createPaymentSession(
    request: PaymentSessionRequest
  ): Promise<PaymentSessionResponse> {
    if (!this.isConfigured()) {
      return {
        sessionId: `err_${crypto.randomUUID().slice(0, 8)}`,
        providerReference: '',
        status: 'FAILED',
        instructions:
          'Ce service n’est pas encore disponible. En attente de convention d’accès à Trésor Pay.',
      };
    }

    const endpoint = (
      process.env.TRESOR_PUBLIC_ENDPOINT || 'https://paiement.tresorbenin.bj/api/v1'
    ).replace(/\/$/, '');
    const sessionId = `sess_tresor_${crypto.randomUUID().slice(0, 10)}`;
    const providerReference = `TP-BJ-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    return {
      sessionId,
      providerReference,
      status: 'REDIRECT_REQUIRED',
      redirectUrl: `${endpoint}/session/${encodeURIComponent(sessionId)}?ref=${encodeURIComponent(request.serviceReference)}`,
      instructions: 'Redirection vers le portail officiel de quittance du Trésor Public.',
    };
  }

  async verifyPaymentStatus(
    providerReference: string
  ): Promise<ProviderStatusCheckResponse> {
    if (!this.isConfigured()) {
      return {
        providerReference,
        isConfirmed: false,
        status: 'FAILED',
        failureReason: 'Clé Trésor Public non configurée.',
      };
    }

    return {
      providerReference,
      isConfirmed: false,
      status: 'PROCESSING',
    };
  }

  async handleVerifiedWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawPayload: string,
    parsedPayload: Record<string, unknown>
  ): Promise<WebhookVerificationOutcome> {
    const check = verifyHmacWebhook({
      secret: process.env.TRESOR_PUBLIC_WEBHOOK_SECRET || '',
      headers,
      rawPayload,
    });
    const rawStatus = String(parsedPayload.status || '').toUpperCase();
    return {
      valid: check.valid,
      providerReference: String(parsedPayload.providerReference || ''),
      isConfirmed: check.valid && (rawStatus === 'PAID' || rawStatus === 'SUCCEEDED'),
      rawStatus: check.valid ? rawStatus || 'UNKNOWN' : 'REJECTED',
      reason: check.reason,
    };
  }
}
