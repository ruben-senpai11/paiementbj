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
export class MoovMoneyAdapter implements PaymentProviderAdapter {
  readonly code: PaymentProviderCode = 'MOOV_MONEY';
  readonly name = 'Moov Money Bénin';

  private hasRealConfig(): boolean {
    return Boolean(process.env.MOOV_MONEY_API_KEY && process.env.MOOV_MONEY_MERCHANT_ID);
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
    let providerFee = 0;
    if (amount <= 5000) providerFee = 50;
    else if (amount <= 20000) providerFee = 150;
    else if (amount <= 50000) providerFee = 300;
    else providerFee = Math.round(amount * 0.01);

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

    const providerReference = `MOOV-BJ-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    return {
      sessionId: `sess_moov_${crypto.randomUUID().slice(0, 10)}`,
      providerReference,
      status: 'PENDING',
      instructions: 'Validez la demande de paiement sur votre mobile Moov Money (*155#).',
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
        failureReason: 'Identifiants Moov Money non configurés.',
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
      rawResponseCode: 'AWAITING_PIN',
    };
  }

  async handleVerifiedWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawPayload: string,
    parsedPayload: Record<string, unknown>
  ): Promise<WebhookVerificationOutcome> {
    const check = verifyHmacWebhook({
      secret: process.env.MOOV_MONEY_WEBHOOK_SECRET || '',
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
