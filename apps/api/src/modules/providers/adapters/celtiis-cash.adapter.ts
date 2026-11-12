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
import { isMvpSimulationEnabled } from '../../../common/mvp-mode.util';

@Injectable()
export class CeltiisCashAdapter implements PaymentProviderAdapter {
  readonly code: PaymentProviderCode = 'CELTIIS_CASH';
  readonly name = 'Celtiis Cash';

  private hasRealConfig(): boolean {
    return Boolean(process.env.CELTIIS_CASH_API_KEY);
  }

  private isConfigured(): boolean {
    return this.hasRealConfig() || isMvpSimulationEnabled();
  }

  getCapabilities(): ProviderCapabilities {
    return {
      directDebit: true,
      hostedCheckout: false,
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
        message: 'Moyen de paiement momentanément indisponible.',
      };
    }
    return {
      status: 'OPERATIONAL',
      message: 'Disponible',
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
        message: 'Validation préalable indisponible.',
      };
    }

    return {
      isValid: request.serviceReference.trim().length >= 3,
      providerCode: this.code,
      serviceId: request.serviceId,
      serviceReference: request.serviceReference.trim(),
      message: 'Référence vérifiée.',
    };
  }

  async getPaymentQuote(
    serviceId: string,
    amount: number,
    currency: 'XOF' | 'EUR' | 'USD' = 'XOF'
  ): Promise<PaymentQuote> {
    const providerFee = Math.round(amount * 0.008);
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
    _request: PaymentSessionRequest
  ): Promise<PaymentSessionResponse> {
    if (!this.isConfigured()) {
      return {
        sessionId: `err_${crypto.randomUUID().slice(0, 8)}`,
        providerReference: '',
        status: 'FAILED',
        instructions: 'Ce moyen de paiement est actuellement indisponible.',
      };
    }

    return {
      sessionId: `sess_celtiis_${crypto.randomUUID().slice(0, 10)}`,
      providerReference: `CELT-BJ-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      status: 'PENDING',
      instructions: 'Confirmez l’opération sur votre application Celtiis Cash ou par USSD.',
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
        failureReason: 'Clé API Celtiis Cash absente.',
      };
    }

    if (isMvpSimulationEnabled() && !this.hasRealConfig()) {
      return {
        providerReference,
        isConfirmed: true,
        status: 'SUCCEEDED',
        settledAt: new Date().toISOString(),
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
      secret: process.env.CELTIIS_CASH_WEBHOOK_SECRET || '',
      headers,
      rawPayload,
    });
    const rawStatus = String(parsedPayload.status || '').toUpperCase();
    return {
      valid: check.valid,
      providerReference: String(parsedPayload.providerReference || ''),
      isConfirmed: check.valid && (rawStatus === 'SUCCESSFUL' || rawStatus === 'SUCCEEDED'),
      rawStatus: check.valid ? rawStatus || 'UNKNOWN' : 'REJECTED',
      reason: check.reason,
    };
  }
}
