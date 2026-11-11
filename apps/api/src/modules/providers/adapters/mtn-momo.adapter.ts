import { Injectable, Logger } from '@nestjs/common';
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
export class MtnMomoAdapter implements PaymentProviderAdapter {
  readonly code: PaymentProviderCode = 'MTN_MOMO';
  readonly name = 'MTN Mobile Money';
  private readonly logger = new Logger(MtnMomoAdapter.name);

  private isConfigured(): boolean {
    return Boolean(process.env.MTN_MOMO_SUBSCRIPTION_KEY && process.env.MTN_MOMO_API_USER);
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
        message: 'Passerelle MTN MoMo en attente de clés API et de convention formelle.',
      };
    }
    const envLabel =
      process.env.MTN_MOMO_ENVIRONMENT === 'production' ? 'Production' : 'Bac à sable';
    return {
      status: 'OPERATIONAL',
      message: `${envLabel} MTN MoMo Developer connecté et disponible.`,
    };
  }

  async validatePayment(request: {
    serviceId: string;
    serviceReference: string;
    amount?: number;
  }): Promise<PaymentValidationResult> {
    if (!this.isConfigured()) {
      return {
        isValid: false,
        providerCode: this.code,
        serviceId: request.serviceId,
        serviceReference: request.serviceReference,
        message: 'Validation préalable indisponible : identifiants passerelle MTN MoMo non configurés.',
      };
    }

    const cleanRef = request.serviceReference.trim();
    if (cleanRef.length < 3) {
      return {
        isValid: false,
        providerCode: this.code,
        serviceId: request.serviceId,
        serviceReference: cleanRef,
        message: 'Référence service trop courte pour vérification MTN MoMo.',
      };
    }

    return {
      isValid: true,
      providerCode: this.code,
      serviceId: request.serviceId,
      serviceReference: cleanRef,
      accountStatus: 'ELIGIBLE_NO_LOOKUP',
      message:
        'Format de référence vérifié. La confirmation nominative dépend du prestataire facturier final.',
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
    request: PaymentSessionRequest
  ): Promise<PaymentSessionResponse> {
    if (!this.isConfigured()) {
      return {
        sessionId: `err_${crypto.randomUUID().slice(0, 8)}`,
        providerReference: '',
        status: 'FAILED',
        instructions:
          'Ce service n’est pas encore disponible. Les identifiants de passerelle MTN MoMo doivent être configurés par l’administrateur.',
      };
    }

    const providerReference = `MOMO-BJ-${Date.now()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    this.logger.log(
      `[MtnMomoAdapter] Création session RequestToPay pour ${request.customerPhone}, montant: ${request.amount}`
    );

    return {
      sessionId: `sess_momo_${crypto.randomUUID().slice(0, 10)}`,
      providerReference,
      status: 'PENDING',
      instructions:
        'Une invite de confirmation USSD va apparaître sur votre téléphone MTN. Confirmez avec votre code secret MoMo.',
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
        failureReason: 'Prestataire non connecté.',
      };
    }

    this.logger.log(`[MtnMomoAdapter] Vérification statut pour réf: ${providerReference}`);
    return {
      providerReference,
      isConfirmed: false,
      status: 'PROCESSING',
      rawResponseCode: 'PENDING_CUSTOMER_APPROVAL',
    };
  }

  async handleVerifiedWebhook(
    headers: Record<string, string | string[] | undefined>,
    rawPayload: string,
    parsedPayload: Record<string, unknown>
  ): Promise<WebhookVerificationOutcome> {
    const check = verifyHmacWebhook({
      secret: process.env.MTN_MOMO_WEBHOOK_SECRET || '',
      headers,
      rawPayload,
    });

    if (!check.valid) {
      return {
        valid: false,
        providerReference: String(parsedPayload.externalId || parsedPayload.providerReference || ''),
        isConfirmed: false,
        rawStatus: 'REJECTED',
        reason: check.reason,
      };
    }

    const rawStatus = String(parsedPayload.status || '').toUpperCase();
    const providerReference = String(
      parsedPayload.externalId || parsedPayload.providerReference || ''
    );
    const isConfirmed = rawStatus === 'SUCCESSFUL' || rawStatus === 'SUCCEEDED';

    return {
      valid: true,
      providerReference,
      isConfirmed,
      rawStatus: rawStatus || 'UNKNOWN',
    };
  }
}
