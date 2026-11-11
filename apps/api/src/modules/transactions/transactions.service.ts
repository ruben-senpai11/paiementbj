import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionSummary, Receipt, TransactionStatus } from '@paiementbj/types';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CatalogService } from '../catalog/catalog.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly catalogService: CatalogService
  ) {}

  private statusLabel(status: TransactionStatus): string {
    switch (status) {
      case 'SUCCEEDED':
        return 'Confirmé';
      case 'INITIATED':
      case 'PENDING':
      case 'PROCESSING':
        return 'En cours';
      case 'CANCELLED':
        return 'Annulé';
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return 'Remboursé';
      default:
        return 'Échoué';
    }
  }

  async listUserTransactions(userId: string): Promise<TransactionSummary[]> {
    try {
      const intents = await this.prisma.paymentIntent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          service: {
            include: { organization: true },
          },
          attempts: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          receipt: true,
        },
      });

      return intents.map((pi) => {
        const lastAttempt = pi.attempts[0];
        const providerCode = (lastAttempt?.providerCode as any) || 'MTN_MOMO';

        return {
          id: pi.id,
          reference: pi.reference,
          serviceCode: pi.service.code,
          serviceTitle: pi.service.title,
          beneficiaryName: pi.service.organization.name,
          organizationLogoKey: pi.service.organization.logoAssetKey,
          amountPrincipal: Number(pi.amountPrincipal),
          providerFee: Number(pi.providerFee),
          totalAmount: Number(pi.totalAmount),
          currency: pi.currency as any,
          providerCode,
          providerReference: lastAttempt?.providerReference || undefined,
          status: pi.status as any,
          statusLabel: this.statusLabel(pi.status as TransactionStatus),
          initiatedAt: pi.createdAt.toISOString(),
          confirmedAt: pi.confirmedAt ? pi.confirmedAt.toISOString() : undefined,
          receiptId: pi.receipt?.id,
          serviceReference: pi.serviceReference,
        };
      });
    } catch {
      // Mode dev sans PostgreSQL : retourne uniquement les intentions réellement initiées en session (0 donnée fictive)
      const memEntries = this.paymentsService.listInMemoryIntentsForUser(userId);
      const services = await this.catalogService.listServices();
      const serviceMap = new Map(services.map((s) => [s.id, s]));

      return memEntries.map(({ intent, lastAttempt, hasReceipt }) => {
        const service = serviceMap.get(intent.serviceId);
        return {
          id: intent.id,
          reference: intent.reference,
          serviceCode: service?.code || intent.serviceId,
          serviceTitle: service?.title || 'Service Paiement BJ',
          beneficiaryName: service?.organization?.name || 'Organisme partenaire',
          organizationLogoKey: service?.organization?.logoAssetKey || 'tresor',
          amountPrincipal: intent.amountPrincipal,
          providerFee: intent.providerFee,
          totalAmount: intent.totalAmount,
          currency: intent.currency,
          providerCode: lastAttempt?.providerCode || 'MTN_MOMO',
          providerReference: lastAttempt?.providerReference || undefined,
          status: intent.status,
          statusLabel: this.statusLabel(intent.status),
          initiatedAt: intent.createdAt,
          confirmedAt: intent.confirmedAt,
          receiptId: hasReceipt ? `rec_${intent.id}` : undefined,
          serviceReference: intent.serviceReference,
        };
      });
    }
  }

  async getTransactionById(userId: string, id: string): Promise<TransactionSummary> {
    const list = await this.listUserTransactions(userId);
    const found = list.find((t) => t.id === id || t.reference === id);
    if (!found) {
      throw new NotFoundException('Transaction introuvable.');
    }
    return found;
  }

  async getReceipt(userId: string, transactionId: string): Promise<Receipt> {
    const transaction = await this.getTransactionById(userId, transactionId);
    if (transaction.status !== 'SUCCEEDED') {
      throw new NotFoundException(
        'Aucun reçu disponible. Un reçu officiel ne peut être délivré que pour un paiement effectivement confirmé.'
      );
    }
    return await this.paymentsService.generateVerifiedReceipt(transaction.id);
  }
}
