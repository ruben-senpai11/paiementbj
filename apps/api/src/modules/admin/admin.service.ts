import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IntegrationStatus, TransactionSummary } from '@paiementbj/types';
import { AdminLoginDto, UpdateSupportTicketAdminDto } from '@paiementbj/schemas';
import { verifyPasswordScrypt } from '../../common/password-hash.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { AuditService } from '../audit/audit.service';
import { CatalogService } from '../catalog/catalog.service';
import { PaymentsService } from '../payments/payments.service';
import { SupportService } from '../support/support.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly providersService: ProvidersService,
    private readonly catalogService: CatalogService,
    private readonly paymentsService: PaymentsService,
    private readonly supportService: SupportService,
    private readonly auditService: AuditService
  ) {}

  async login(dto: AdminLoginDto) {
    const emailNormalized = dto.email.trim().toLowerCase();
    let adminRecord: { id: string; email: string; name: string; role: string } | null = null;

    try {
      if (await this.prisma.checkAvailable()) {
        const dbAdmin = await this.prisma.adminUser.findUnique({
          where: { email: emailNormalized },
        });
        if (
          dbAdmin &&
          dbAdmin.isActive &&
          verifyPasswordScrypt(dto.password, dbAdmin.passwordHash)
        ) {
          adminRecord = {
            id: dbAdmin.id,
            email: dbAdmin.email,
            name: dbAdmin.name,
            role: dbAdmin.role,
          };
        }
      }
    } catch {
      this.prisma.markUnavailable();
      // Base non connectée — vérification stricte via configuration bootstrap si explicitement définie
    }

    if (!adminRecord) {
      const bootstrapEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
      const bootstrapHash = process.env.ADMIN_BOOTSTRAP_PASSWORD_HASH || '';

      if (
        bootstrapEmail &&
        bootstrapHash &&
        emailNormalized === bootstrapEmail &&
        verifyPasswordScrypt(dto.password, bootstrapHash)
      ) {
        adminRecord = {
          id: 'adm_bootstrap_01',
          email: bootstrapEmail,
          name: process.env.ADMIN_BOOTSTRAP_NAME || 'Opérateur Gouvernance Paiement BJ',
          role: (process.env.ADMIN_BOOTSTRAP_ROLE as any) || 'SUPERADMIN',
        };
      }
    }

    if (!adminRecord) {
      await this.auditService.log({
        actorType: 'ADMIN',
        action: 'ADMIN_LOGIN_FAILED',
        resourceType: 'admin_auth',
        details: { email: emailNormalized },
      });
      throw new UnauthorizedException('Identifiants administrateur invalides ou compte inactif.');
    }

    const tokenPayload = {
      sub: adminRecord.id,
      email: adminRecord.email,
      actorType: 'ADMIN' as const,
      role: adminRecord.role,
    };
    const accessToken = this.jwtService.sign(tokenPayload, { expiresIn: '2h' });

    await this.auditService.log({
      actorId: adminRecord.id,
      actorType: 'ADMIN',
      action: 'ADMIN_LOGIN_SUCCESS',
      resourceType: 'admin_auth',
      resourceId: adminRecord.id,
      details: { role: adminRecord.role },
    });

    return {
      accessToken,
      admin: adminRecord,
    };
  }

  async getDashboardStats() {
    let usersCount = 0;
    let transactionsCount = 0;
    let volumeTotal = 0;
    let openTicketsCount = 0;
    let loadedFromDb = false;

    try {
      if (await this.prisma.checkAvailable()) {
        usersCount = await this.prisma.user.count();
        transactionsCount = await this.prisma.paymentIntent.count();
        const sum = await this.prisma.paymentIntent.aggregate({
          _sum: { totalAmount: true },
          where: { status: 'SUCCEEDED' },
        });
        volumeTotal = sum._sum.totalAmount || 0;
        openTicketsCount = await this.prisma.supportTicket.count({
          where: { status: 'OPEN' },
        });
        loadedFromDb = true;
      }
    } catch {
      this.prisma.markUnavailable();
    }

    if (!loadedFromDb) {
      const memIntents = this.paymentsService.listAllInMemoryIntents();
      const tickets = await this.supportService.listAllTicketsForAdmin();
      const uniqueUsers = new Set(memIntents.map((e) => e.intent.userId));
      usersCount = uniqueUsers.size;
      transactionsCount = memIntents.length;
      volumeTotal = memIntents
        .filter((e) => e.intent.status === 'SUCCEEDED')
        .reduce((acc, e) => acc + e.intent.totalAmount, 0);
      openTicketsCount = tickets.filter((t) => t.status === 'OPEN').length;
    }

    const providers = await this.providersService.listProviders();

    return {
      usersCount,
      transactionsCount,
      volumeTotal,
      openTicketsCount,
      providersSummary: providers.map((p) => ({
        code: p.code,
        name: p.name,
        availability: p.availability,
        message: p.statusMessage,
      })),
    };
  }

  async listAuditLogs(limit = 100) {
    return await this.auditService.getRecentLogs(limit);
  }

  async listTransactions(): Promise<TransactionSummary[]> {
    try {
      if (await this.prisma.checkAvailable()) {
        const dbIntents = await this.prisma.paymentIntent.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            service: { include: { organization: true } },
            attempts: { take: 1, orderBy: { createdAt: 'desc' } },
            receipt: true,
          },
        });
        if (dbIntents.length > 0) {
          return dbIntents.map((pi) => {
            const lastAttempt = pi.attempts[0];
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
              providerCode: (lastAttempt?.providerCode as any) || 'MTN_MOMO',
              providerReference: lastAttempt?.providerReference || undefined,
              status: pi.status as any,
              statusLabel:
                pi.status === 'SUCCEEDED'
                  ? 'Confirmé'
                  : pi.status === 'PENDING' || pi.status === 'PROCESSING'
                  ? 'En cours'
                  : 'Échoué',
              initiatedAt: pi.createdAt.toISOString(),
              confirmedAt: pi.confirmedAt ? pi.confirmedAt.toISOString() : undefined,
              receiptId: pi.receipt?.id,
              serviceReference: pi.serviceReference,
            };
          });
        }
      }
    } catch {
      this.prisma.markUnavailable();
      // Fallback session réelle en mémoire
    }

    const memEntries = this.paymentsService.listAllInMemoryIntents();
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
        statusLabel:
          intent.status === 'SUCCEEDED'
            ? 'Confirmé'
            : intent.status === 'PENDING' || intent.status === 'PROCESSING'
            ? 'En cours'
            : 'Échoué',
        initiatedAt: intent.createdAt,
        confirmedAt: intent.confirmedAt,
        receiptId: hasReceipt ? `rec_${intent.id}` : undefined,
        serviceReference: intent.serviceReference,
      };
    });
  }

  async updateServiceStatus(serviceId: string, status: IntegrationStatus, adminId: string) {
    this.catalogService.setServiceStatusOverride(serviceId, status);

    try {
      if (await this.prisma.checkAvailable()) {
        const updated = await this.prisma.service.update({
          where: { id: serviceId },
          data: { integrationStatus: status },
        });

        await this.auditService.log({
          actorId: adminId,
          actorType: 'ADMIN',
          action: 'CATALOG_SERVICE_STATUS_UPDATED',
          resourceType: 'service',
          resourceId: serviceId,
          details: { newStatus: status },
        });

        return updated;
      }
    } catch {
      this.prisma.markUnavailable();
    }

    await this.auditService.log({
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'CATALOG_SERVICE_STATUS_UPDATED',
      resourceType: 'service',
      resourceId: serviceId,
      details: { newStatus: status, mode: 'memory' },
    });
    return { id: serviceId, integrationStatus: status };
  }

  async listSupportTickets() {
    return await this.supportService.listAllTicketsForAdmin();
  }

  async updateSupportTicket(
    ticketId: string,
    dto: UpdateSupportTicketAdminDto,
    adminId: string
  ) {
    return await this.supportService.updateTicketByAdmin(
      ticketId,
      dto.status,
      dto.resolutionNotes,
      adminId
    );
  }
}
