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
export class BankCardAdapter implements PaymentProviderAdapter {
  readonly code: PaymentProviderCode = 'BANK_CARD';
  readonly name = 'Cartes Bancaires Internationales (Visa / Mastercard)';

  private isConfigured(): boolean {
    return Boolean(process.env.CARD_GATEWAY_SECRET_KEY);
  }

  getCapabilities(): ProviderCapabilities {
    return {
      directDebit: false,
      hostedCheckout: true,
      qrCode: false,
      webhookNotification: true,
      refundSupport: true,
      statusQuery: true,
      currencyConversion: true,
    };
  }

  async getAvailability(): Promise<{ status: ProviderAvailability; message?: string }> {
    if (!this.isConfigured()) {
      return {
        status: 'UNAVAILABLE',
        message:
          'Passerelle bancaire internationale en cours de certification PCI DSS et agrément bancaire.',
      };
    }
    return {
      status: 'OPERATIONAL',
      message: 'Passerelle carte bancaire connectée.',
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
        message: 'Validation préalable indisponible : acquéreur bancaire non raccordé.',
      };
    }
    return {
      isValid: request.serviceReference.trim().length >= 3,
      providerCode: this.code,
      serviceId: request.serviceId,
      serviceReference: request.serviceReference.trim(),
      message: 'Référence vérifiée pour session 3D-Secure hébergée.',
    };
  }

  async getPaymentQuote(
    serviceId: string,
    amount: number,
    currency: 'XOF' | 'EUR' | 'USD' = 'XOF'
  ): Promise<PaymentQuote> {
    const providerFee = Math.round(amount * 0.025);
    return {
      serviceId,
      providerCode: this.code,
      amountPrincipal: amount,
      providerFee,
      platformFee: 0,
      totalAmount: amount + providerFee,
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
          'Ce service n’est pas encore disponible. En attente de finalisation du contrat d’acquisition bancaire.',
      };
    }

    const baseUrl = (process.env.CARD_GATEWAY_CHECKOUT_URL || '').replace(/\/$/, '');
    if (!baseUrl) {
      return {
        sessionId: `err_${crypto.randomUUID().slice(0, 8)}`,
        providerReference: '',
        status: 'FAILED',
        instructions:
          'URL de paiement hébergé 3D-Secure partenaire non configurée (CARD_GATEWAY_CHECKOUT_URL).',
      };
    }

    const sessionId = `sess_card_${crypto.randomUUID().slice(0, 10)}`;
    const providerReference = `CARD-BJ-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    return {
      sessionId,
      providerReference,
      status: 'REDIRECT_REQUIRED',
      redirectUrl: `${baseUrl}/${encodeURIComponent(sessionId)}?intent=${encodeURIComponent(request.paymentIntentId)}`,
      instructions:
        'Vous allez être redirigé vers la page sécurisée de saisie 3D-Secure de la banque.',
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
        failureReason: 'Passerelle carte non configurée.',
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
      secret: process.env.CARD_GATEWAY_WEBHOOK_SECRET || '',
      headers,
      rawPayload,
    });
    const rawStatus = String(parsedPayload.status || '').toUpperCase();
    return {
      valid: check.valid,
      providerReference: String(parsedPayload.providerReference || ''),
      isConfirmed: check.valid && (rawStatus === 'CAPTURED' || rawStatus === 'SUCCEEDED'),
      rawStatus: check.valid ? rawStatus || 'UNKNOWN' : 'REJECTED',
      reason: check.reason,
    };
  }
}
