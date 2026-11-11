import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  PaymentIntent,
  PaymentQuote,
  PaymentSessionResponse,
  PaymentValidationResult,
  ProviderStatusCheckResponse,
  Receipt,
  TransactionStatus,
  PaymentProviderCode,
  ProviderSummary,
} from '@paiementbj/types';
import {
  CreatePaymentIntentDto,
  CreatePaymentAttemptDto,
  PaymentQuoteDto,
  ValidatePaymentDto,
} from '@paiementbj/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CatalogService } from '../catalog/catalog.service';
import { ProvidersService } from '../providers/providers.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface InMemoryAttemptRecord {
  id: string;
  paymentIntentId: string;
  providerCode: PaymentProviderCode;
  providerReference: string;
  status: TransactionStatus;
  rawStatus?: string;
  createdAt: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly inMemoryIntents = new Map<string, PaymentIntent>();
  private readonly inMemoryAttemptsByIntent = new Map<string, InMemoryAttemptRecord[]>();
  private readonly inMemoryReceipts = new Map<string, Receipt>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly providers: ProvidersService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService
  ) {}

  async listProviders(): Promise<ProviderSummary[]> {
    return await this.providers.listProviders();
  }

  async getQuote(dto: PaymentQuoteDto): Promise<PaymentQuote> {
    const service = await this.catalog.getServiceById(dto.serviceId);
    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }
    this.validateAmountWithinServiceBounds(service, dto.amount);
    return await this.providers.getQuote(service.id, dto.providerCode, dto.amount, dto.currency);
  }

  async validatePayment(dto: ValidatePaymentDto): Promise<PaymentValidationResult> {
    const service = await this.catalog.getServiceById(dto.serviceId);
    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }
    if (dto.amount !== undefined) {
      this.validateAmountWithinServiceBounds(service, dto.amount);
    }
    return await this.providers.validatePayment({
      serviceId: service.id,
      providerCode: dto.providerCode,
      serviceReference: dto.serviceReference,
      amount: dto.amount,
    });
  }

  async createIntent(userId: string, dto: CreatePaymentIntentDto): Promise<PaymentIntent> {
    const service = await this.catalog.getServiceById(dto.serviceId);
    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }

    if (
      service.integrationStatus === 'PENDING_AGREEMENT' ||
      service.integrationStatus === 'TECHNICAL_IN_PROGRESS' ||
      service.integrationStatus === 'UNAVAILABLE'
    ) {
      throw new ServiceUnavailableException(
        service.statusMessage ||
          'Ce service n’est pas encore disponible pour les paiements réels.'
      );
    }

    this.validateAmountWithinServiceBounds(service, dto.amount);

    // Contrôle d'idempotence strict par clé + utilisateur
    try {
      const existing = await this.prisma.paymentIntent.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        if (existing.userId !== userId) {
          throw new ForbiddenException('Clé d’idempotence déjà utilisée par un autre compte.');
        }
        this.logger.log(`[Idempotence] Retour de l’intention existante ${existing.id}`);
        return this.mapDbIntent(existing);
      }
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      for (const it of this.inMemoryIntents.values()) {
        if (it.idempotencyKey === dto.idempotencyKey) {
          if (it.userId !== userId) {
            throw new ForbiddenException('Clé d’idempotence déjà utilisée par un autre compte.');
          }
          return it;
        }
      }
    }

    const providerFee = service.fixedFee || 0;
    const totalAmount = dto.amount + providerFee;

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = crypto.randomInt(10000, 100000);
    const reference = `PBJ-${todayStr}-${randSuffix}`;

    let intent: PaymentIntent;
    try {
      const dbIntent = await this.prisma.paymentIntent.create({
        data: {
          userId,
          serviceId: service.id,
          amountPrincipal: dto.amount,
          providerFee,
          totalAmount,
          currency: service.currency,
          serviceReference: dto.serviceReference,
          customerData: dto.customerData as any,
          status: 'INITIATED',
          idempotencyKey: dto.idempotencyKey,
          reference,
          events: {
            create: {
              eventType: 'intent_created',
              toStatus: 'INITIATED',
              payload: { initiatedBy: userId },
            },
          },
        },
      });
      intent = this.mapDbIntent(dbIntent);
    } catch (err: any) {
      this.logger.warn(`Fallback intention en mémoire : ${err.message}`);
      const nowIso = new Date().toISOString();
      intent = {
        id: `pi_${crypto.randomUUID()}`,
        userId,
        serviceId: service.id,
        amountPrincipal: dto.amount,
        providerFee,
        totalAmount,
        currency: service.currency,
        serviceReference: dto.serviceReference,
        customerData: dto.customerData,
        status: 'INITIATED',
        idempotencyKey: dto.idempotencyKey,
        reference,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      this.inMemoryIntents.set(intent.id, intent);
    }

    await this.audit.log({
      actorId: userId,
      actorType: 'USER',
      action: 'PAYMENT_INTENT_CREATED',
      resourceType: 'payment_intent',
      resourceId: intent.id,
      details: { reference, amount: dto.amount, serviceCode: service.code },
    });

    return intent;
  }

  async createAttempt(
    userId: string,
    dto: CreatePaymentAttemptDto
  ): Promise<PaymentSessionResponse> {
    const intent = await this.getIntentById(dto.paymentIntentId);
    if (!intent) {
      throw new NotFoundException('Intention de paiement introuvable.');
    }
    if (intent.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette intention de paiement.');
    }
    if (intent.status === 'SUCCEEDED') {
      throw new BadRequestException('Cette transaction a déjà été réglée avec succès.');
    }

    const adapter = this.providers.getAdapter(dto.providerCode);
    const avail = await adapter.getAvailability();

    if (avail.status === 'UNAVAILABLE' || avail.status === 'MAINTENANCE') {
      return {
        sessionId: `err_${crypto.randomUUID().slice(0, 8)}`,
        providerReference: '',
        status: 'FAILED',
        instructions:
          avail.message ||
          'Ce moyen de paiement n’est pas encore disponible. Veuillez sélectionner un autre prestataire.',
      };
    }

    const quote = await adapter.getPaymentQuote(
      intent.serviceId,
      intent.amountPrincipal,
      intent.currency
    );

    const sessionResponse = await adapter.createPaymentSession({
      paymentIntentId: intent.id,
      amount: quote.totalAmount,
      currency: intent.currency,
      customerPhone: dto.payerPhone || '',
      serviceReference: intent.serviceReference,
      returnUrl: dto.returnUrl,
    });

    const nextIntentStatus: TransactionStatus =
      sessionResponse.status === 'FAILED' ? 'FAILED' : 'PENDING';

    try {
      await this.prisma.paymentAttempt.create({
        data: {
          paymentIntentId: intent.id,
          providerCode: dto.providerCode as any,
          providerReference: sessionResponse.providerReference || null,
          status: nextIntentStatus,
        },
      });

      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          providerFee: quote.providerFee,
          totalAmount: quote.totalAmount,
          status: nextIntentStatus,
        },
      });
    } catch {
      intent.providerFee = quote.providerFee;
      intent.totalAmount = quote.totalAmount;
      intent.status = nextIntentStatus;
      intent.updatedAt = new Date().toISOString();
      this.inMemoryIntents.set(intent.id, intent);

      const attempts = this.inMemoryAttemptsByIntent.get(intent.id) || [];
      attempts.unshift({
        id: `att_${crypto.randomUUID()}`,
        paymentIntentId: intent.id,
        providerCode: dto.providerCode,
        providerReference: sessionResponse.providerReference,
        status: nextIntentStatus,
        createdAt: new Date().toISOString(),
      });
      this.inMemoryAttemptsByIntent.set(intent.id, attempts);
    }

    await this.audit.log({
      actorId: userId,
      actorType: 'USER',
      action: 'PAYMENT_ATTEMPT_STARTED',
      resourceType: 'payment_attempt',
      resourceId: sessionResponse.providerReference || intent.id,
      details: {
        provider: dto.providerCode,
        status: sessionResponse.status,
        totalAmount: quote.totalAmount,
      },
    });

    return sessionResponse;
  }

  async getStatus(userId: string, intentId: string): Promise<ProviderStatusCheckResponse> {
    const intent = await this.getIntentById(intentId);
    if (!intent) {
      throw new NotFoundException('Intention introuvable.');
    }
    if (intent.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette transaction.');
    }

    if (intent.status === 'SUCCEEDED') {
      return {
        providerReference: intent.reference,
        isConfirmed: true,
        status: 'SUCCEEDED',
        settledAt: intent.confirmedAt,
      };
    }

    const normalizedStatus =
      intent.status === 'INITIATED' || intent.status === 'EXPIRED'
        ? 'PENDING'
        : intent.status === 'REFUNDED' || intent.status === 'PARTIALLY_REFUNDED'
        ? 'SUCCEEDED'
        : intent.status;

    return {
      providerReference: intent.reference,
      isConfirmed: false,
      status: normalizedStatus,
      rawResponseCode:
        normalizedStatus === 'FAILED' ? 'PROVIDER_UNAVAILABLE_OR_REJECTED' : 'AWAITING_PROVIDER_SETTLEMENT',
    };
  }

  async handleProviderWebhook(params: {
    providerParam: string;
    headers: Record<string, string | string[] | undefined>;
    rawBody: string;
    parsedPayload: Record<string, unknown>;
  }): Promise<{ received: boolean; idempotent?: boolean; status: TransactionStatus; intentId?: string }> {
    const providerCode = this.normalizeProviderCode(params.providerParam);
    const adapter = this.providers.getAdapter(providerCode);

    if (!adapter.handleVerifiedWebhook) {
      throw new BadRequestException('Ce prestataire ne prend pas en charge les notifications webhook.');
    }

    const verification = await adapter.handleVerifiedWebhook(
      params.headers,
      params.rawBody,
      params.parsedPayload
    );

    if (!verification.valid) {
      await this.audit.log({
        actorType: 'PROVIDER',
        action: 'WEBHOOK_SIGNATURE_REJECTED',
        resourceType: 'webhook',
        resourceId: providerCode,
        details: { reason: verification.reason },
      });
      if (verification.reason === 'WEBHOOK_SECRET_NOT_CONFIGURED') {
        throw new ServiceUnavailableException(
          'Clé secrète de signature webhook non configurée pour ce prestataire.'
        );
      }
      throw new UnauthorizedException(`Signature webhook invalide (${verification.reason}).`);
    }

    const ref = verification.providerReference;
    if (!ref) {
      throw new BadRequestException('Référence prestataire manquante dans le payload webhook.');
    }

    const intent = await this.findIntentByProviderOrInternalReference(ref);
    if (!intent) {
      throw new NotFoundException(`Aucune transaction associée à la référence ${ref}.`);
    }

    // Idempotence stricte des webhooks : ne jamais retraiter un paiement déjà confirmé
    if (intent.status === 'SUCCEEDED') {
      return { received: true, idempotent: true, status: 'SUCCEEDED', intentId: intent.id };
    }

    const nextStatus: TransactionStatus = verification.isConfirmed ? 'SUCCEEDED' : 'FAILED';
    const confirmedAt = verification.isConfirmed ? new Date().toISOString() : undefined;

    try {
      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: nextStatus,
          ...(confirmedAt ? { confirmedAt: new Date(confirmedAt) } : {}),
          events: {
            create: {
              eventType: 'webhook_received',
              fromStatus: intent.status,
              toStatus: nextStatus,
              payload: params.parsedPayload as any,
            },
          },
        },
      });
      await this.prisma.paymentAttempt.updateMany({
        where: { paymentIntentId: intent.id, providerReference: ref },
        data: {
          status: nextStatus,
          rawStatus: verification.rawStatus,
        },
      });
    } catch {
      intent.status = nextStatus;
      intent.updatedAt = new Date().toISOString();
      if (confirmedAt) intent.confirmedAt = confirmedAt;
      this.inMemoryIntents.set(intent.id, intent);

      const attempts = this.inMemoryAttemptsByIntent.get(intent.id) || [];
      for (const att of attempts) {
        if (att.providerReference === ref) {
          att.status = nextStatus;
          att.rawStatus = verification.rawStatus;
        }
      }
    }

    if (nextStatus === 'SUCCEEDED') {
      await this.generateVerifiedReceipt(intent.id);
      await this.notifications.notifyUser(intent.userId, {
        title: 'Paiement confirmé',
        body: `Votre paiement ${intent.reference} de ${intent.totalAmount} ${intent.currency} a été confirmé.`,
        type: 'PAYMENT_STATUS',
        resourceId: intent.id,
      });
    } else {
      await this.notifications.notifyUser(intent.userId, {
        title: 'Échec du paiement',
        body: `Le paiement ${intent.reference} n’a pas pu être confirmé (${verification.rawStatus}).`,
        type: 'PAYMENT_STATUS',
        resourceId: intent.id,
      });
    }

    await this.audit.log({
      actorId: intent.userId,
      actorType: 'PROVIDER',
      action: nextStatus === 'SUCCEEDED' ? 'PAYMENT_CONFIRMED_WEBHOOK' : 'PAYMENT_FAILED_WEBHOOK',
      resourceType: 'payment_intent',
      resourceId: intent.id,
      details: {
        providerCode,
        providerReference: ref,
        rawStatus: verification.rawStatus,
      },
    });

    return {
      received: true,
      idempotent: false,
      status: nextStatus,
      intentId: intent.id,
    };
  }

  async generateVerifiedReceipt(intentId: string): Promise<Receipt> {
    const existingMem = this.inMemoryReceipts.get(intentId);
    if (existingMem) {
      return existingMem;
    }

    const intent = await this.getIntentById(intentId);
    if (!intent) throw new NotFoundException('Transaction introuvable.');

    const service = await this.catalog.getServiceById(intent.serviceId);
    const attempts = this.inMemoryAttemptsByIntent.get(intent.id) || [];
    const lastAttempt = attempts[0];
    const providerName = lastAttempt
      ? this.providers.getAdapter(lastAttempt.providerCode).name
      : 'Réseau Interopérable Paiement BJ';
    const providerReference = lastAttempt?.providerReference || intent.reference;

    const receiptNumber = `REC-BJ-${new Date().getFullYear()}-${intent.reference.replace('PBJ-', '')}`;
    const rawData = `${receiptNumber}|${intent.reference}|${intent.totalAmount}|${intent.serviceReference}|${providerReference}`;
    const digitalSignatureHash = crypto
      .createHash('sha256')
      .update(rawData)
      .digest('hex')
      .toUpperCase();

    const receipt: Receipt = {
      id: `rec_${intent.id}`,
      receiptNumber,
      transactionId: intent.id,
      beneficiaryName: service?.organization?.name || 'République du Bénin',
      serviceTitle: service?.title || 'Service public',
      serviceReference: intent.serviceReference,
      amountPrincipal: intent.amountPrincipal,
      fees: intent.providerFee,
      totalAmount: intent.totalAmount,
      currency: intent.currency,
      payerPhone: intent.customerData?.payerPhone || 'Titulaire du compte',
      providerName,
      providerReference,
      issuedAt: new Date().toISOString(),
      digitalSignatureHash,
      isVerified: true,
    };

    try {
      await this.prisma.receipt.upsert({
        where: { paymentIntentId: intent.id },
        update: {},
        create: {
          paymentIntentId: intent.id,
          receiptNumber: receipt.receiptNumber,
          beneficiaryName: receipt.beneficiaryName,
          serviceTitle: receipt.serviceTitle,
          serviceReference: receipt.serviceReference,
          amountPrincipal: receipt.amountPrincipal,
          fees: receipt.fees,
          totalAmount: receipt.totalAmount,
          currency: receipt.currency,
          payerPhone: receipt.payerPhone,
          providerName: receipt.providerName,
          providerReference: receipt.providerReference,
          digitalSignatureHash: receipt.digitalSignatureHash,
          isVerified: true,
        },
      });
    } catch {
      // Fallback mémoire uniquement
    }

    this.inMemoryReceipts.set(intent.id, receipt);
    return receipt;
  }

  async getIntentById(id: string): Promise<PaymentIntent | null> {
    try {
      const db = await this.prisma.paymentIntent.findUnique({
        where: { id },
      });
      if (db) return this.mapDbIntent(db);
    } catch {
      // Fallback mémoire
    }
    return this.inMemoryIntents.get(id) || null;
  }

  listInMemoryIntentsForUser(userId: string): Array<{
    intent: PaymentIntent;
    lastAttempt?: InMemoryAttemptRecord;
    hasReceipt: boolean;
  }> {
    return Array.from(this.inMemoryIntents.values())
      .filter((i) => i.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((intent) => ({
        intent,
        lastAttempt: (this.inMemoryAttemptsByIntent.get(intent.id) || [])[0],
        hasReceipt: this.inMemoryReceipts.has(intent.id),
      }));
  }

  listAllInMemoryIntents(): Array<{
    intent: PaymentIntent;
    lastAttempt?: InMemoryAttemptRecord;
    hasReceipt: boolean;
  }> {
    return Array.from(this.inMemoryIntents.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((intent) => ({
        intent,
        lastAttempt: (this.inMemoryAttemptsByIntent.get(intent.id) || [])[0],
        hasReceipt: this.inMemoryReceipts.has(intent.id),
      }));
  }

  private async findIntentByProviderOrInternalReference(ref: string): Promise<PaymentIntent | null> {
    try {
      const attempt = await this.prisma.paymentAttempt.findFirst({
        where: { providerReference: ref },
        include: { paymentIntent: true },
      });
      if (attempt?.paymentIntent) {
        return this.mapDbIntent(attempt.paymentIntent);
      }
      const byRef = await this.prisma.paymentIntent.findUnique({
        where: { reference: ref },
      });
      if (byRef) return this.mapDbIntent(byRef);
    } catch {
      // Fallback mémoire
    }

    for (const [intentId, attempts] of this.inMemoryAttemptsByIntent.entries()) {
      if (attempts.some((a) => a.providerReference === ref)) {
        return this.inMemoryIntents.get(intentId) || null;
      }
    }
    for (const intent of this.inMemoryIntents.values()) {
      if (intent.reference === ref || intent.id === ref) {
        return intent;
      }
    }
    return null;
  }

  private normalizeProviderCode(raw: string): PaymentProviderCode {
    const normalized = raw.trim().toUpperCase().replace(/-/g, '_');
    if (
      normalized === 'MTN_MOMO' ||
      normalized === 'MOOV_MONEY' ||
      normalized === 'CELTIIS_CASH' ||
      normalized === 'BANK_CARD' ||
      normalized === 'TRESOR_PAY'
    ) {
      return normalized;
    }
    throw new NotFoundException(`Prestataire webhook inconnu : ${raw}`);
  }

  private validateAmountWithinServiceBounds(
    service: { minAmount?: number; maxAmount?: number },
    amount: number
  ) {
    if (service.minAmount !== undefined && amount < service.minAmount) {
      throw new BadRequestException(
        `Le montant minimum pour ce service est de ${service.minAmount} FCFA.`
      );
    }
    if (service.maxAmount !== undefined && amount > service.maxAmount) {
      throw new BadRequestException(
        `Le montant maximum autorisé pour ce service est de ${service.maxAmount} FCFA.`
      );
    }
  }

  private mapDbIntent(db: any): PaymentIntent {
    return {
      id: db.id,
      reference: db.reference || '',
      userId: db.userId,
      serviceId: db.serviceId,
      amountPrincipal: Number(db.amountPrincipal),
      providerFee: Number(db.providerFee),
      totalAmount: Number(db.totalAmount),
      currency: db.currency,
      serviceReference: db.serviceReference,
      customerData: db.customerData as any,
      status: db.status as TransactionStatus,
      idempotencyKey: db.idempotencyKey,
      createdAt: db.createdAt instanceof Date ? db.createdAt.toISOString() : db.createdAt,
      updatedAt: db.updatedAt instanceof Date ? db.updatedAt.toISOString() : db.updatedAt,
      confirmedAt: db.confirmedAt
        ? db.confirmedAt instanceof Date
          ? db.confirmedAt.toISOString()
          : db.confirmedAt
        : undefined,
    };
  }
}
