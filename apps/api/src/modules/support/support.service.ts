import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { SupportTicket, TicketStatus, TicketCategory } from '@paiementbj/types';
import { CreateSupportTicketDto, AddSupportMessageDto } from '@paiementbj/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  private readonly inMemoryTickets = new Map<string, SupportTicket>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService
  ) {}

  private statusLabel(status: TicketStatus): string {
    switch (status) {
      case 'OPEN':
        return 'En attente de prise en charge';
      case 'INVESTIGATING':
        return 'En cours d’instruction';
      case 'RESOLVED':
        return 'Résolu';
      case 'CLOSED':
        return 'Clôturé';
    }
  }

  private categoryLabel(cat: TicketCategory): string {
    const labels: Record<TicketCategory, string> = {
      DEBITED_NOT_CREDITED: 'Débité mais service non crédité',
      INCORRECT_AMOUNT: 'Montant prélevé incorrect',
      REFERENCE_ERROR: 'Erreur sur la référence saisie',
      RECEIPT_NOT_GENERATED: 'Reçu non disponible',
      TECHNICAL_DIFFICULTY: 'Problème technique / Écran bloqué',
      OTHER: 'Autre motif',
    };
    return labels[cat] || cat;
  }

  async createTicket(userId: string, dto: CreateSupportTicketDto): Promise<SupportTicket> {
    const randSuffix = crypto.randomInt(1000, 10000);
    const ticketNumber = `TK-2026-${randSuffix}`;

    let ticket: SupportTicket;

    try {
      const dbTicket = await this.prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId,
          transactionId: dto.transactionId,
          category: dto.category as any,
          title: dto.title,
          description: dto.description,
          status: 'OPEN',
          messages: {
            create: {
              senderType: 'USER',
              senderName: 'Usager',
              content: dto.description,
            },
          },
        },
        include: { messages: true },
      });

      ticket = this.mapDbTicket(dbTicket);
    } catch {
      const nowIso = new Date().toISOString();
      ticket = {
        id: `tk_${crypto.randomUUID()}`,
        ticketNumber,
        userId,
        transactionId: dto.transactionId,
        category: dto.category,
        categoryLabel: this.categoryLabel(dto.category),
        title: dto.title,
        description: dto.description,
        status: 'OPEN',
        statusLabel: this.statusLabel('OPEN'),
        createdAt: nowIso,
        updatedAt: nowIso,
        messages: [
          {
            id: `msg_${crypto.randomUUID()}`,
            senderType: 'USER',
            senderName: 'Usager',
            content: dto.description,
            createdAt: nowIso,
          },
        ],
      };
      this.inMemoryTickets.set(ticket.id, ticket);
    }

    await this.audit.log({
      actorId: userId,
      actorType: 'USER',
      action: 'SUPPORT_TICKET_CREATED',
      resourceType: 'support_ticket',
      resourceId: ticket.id,
      details: { ticketNumber, category: dto.category },
    });

    return ticket;
  }

  async listUserTickets(userId: string): Promise<SupportTicket[]> {
    try {
      const dbTickets = await this.prisma.supportTicket.findMany({
        where: { userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });

      if (dbTickets.length > 0) {
        return dbTickets.map((t) => this.mapDbTicket(t));
      }
    } catch {
      // Fallback mémoire
    }

    return Array.from(this.inMemoryTickets.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getTicketById(userId: string, id: string): Promise<SupportTicket> {
    const tickets = await this.listUserTickets(userId);
    const found = tickets.find((t) => t.id === id || t.ticketNumber === id);
    if (!found) {
      throw new NotFoundException('Réclamation introuvable.');
    }
    return found;
  }

  async addMessage(
    userId: string,
    ticketId: string,
    dto: AddSupportMessageDto
  ): Promise<SupportTicket> {
    const existing = await this.getTicketById(userId, ticketId);

    try {
      await this.prisma.supportMessage.create({
        data: {
          ticketId: existing.id,
          senderType: 'USER',
          senderName: 'Usager',
          content: dto.content,
        },
      });
      await this.prisma.supportTicket.update({
        where: { id: existing.id },
        data: { updatedAt: new Date() },
      });
      return await this.getTicketById(userId, existing.id);
    } catch {
      const nowIso = new Date().toISOString();
      const mem = this.inMemoryTickets.get(existing.id);
      if (!mem) {
        throw new NotFoundException('Réclamation introuvable.');
      }
      mem.messages.push({
        id: `msg_${crypto.randomUUID()}`,
        senderType: 'USER',
        senderName: 'Usager',
        content: dto.content,
        createdAt: nowIso,
      });
      mem.updatedAt = nowIso;
      this.inMemoryTickets.set(mem.id, mem);

      await this.audit.log({
        actorId: userId,
        actorType: 'USER',
        action: 'SUPPORT_MESSAGE_ADDED',
        resourceType: 'support_ticket',
        resourceId: mem.id,
      });

      return mem;
    }
  }

  async listAllTicketsForAdmin(): Promise<SupportTicket[]> {
    try {
      if (await this.prisma.checkAvailable()) {
        const dbTickets = await this.prisma.supportTicket.findMany({
          include: { messages: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        });
        if (dbTickets.length > 0) {
          return dbTickets.map((t) => this.mapDbTicket(t));
        }
      }
    } catch {
      this.prisma.markUnavailable();
      // Fallback mémoire
    }
    return Array.from(this.inMemoryTickets.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  async updateTicketByAdmin(
    ticketId: string,
    status: TicketStatus,
    resolutionNotes: string | undefined,
    adminId: string
  ): Promise<SupportTicket> {
    let targetUserId = '';
    let updatedTicket: SupportTicket | null = null;

    try {
      const updated = await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: status as any,
          ...(resolutionNotes ? { resolutionNotes } : {}),
          ...(resolutionNotes
            ? {
                messages: {
                  create: {
                    senderType: 'AGENT',
                    senderName: 'Support Paiement BJ',
                    content: resolutionNotes,
                  },
                },
              }
            : {}),
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      updatedTicket = this.mapDbTicket(updated);
      targetUserId = updated.userId;
    } catch {
      const mem = this.inMemoryTickets.get(ticketId);
      if (mem) {
        mem.status = status;
        mem.statusLabel = this.statusLabel(status);
        mem.updatedAt = new Date().toISOString();
        if (resolutionNotes) {
          mem.resolutionNotes = resolutionNotes;
          mem.messages.push({
            id: `msg_${crypto.randomUUID()}`,
            senderType: 'AGENT',
            senderName: 'Support Paiement BJ',
            content: resolutionNotes,
            createdAt: mem.updatedAt,
          });
        }
        this.inMemoryTickets.set(mem.id, mem);
        updatedTicket = mem;
        targetUserId = mem.userId;
      }
    }

    if (!updatedTicket) {
      throw new NotFoundException('Dossier de réclamation introuvable.');
    }

    await this.audit.log({
      actorId: adminId,
      actorType: 'ADMIN',
      action: 'SUPPORT_TICKET_UPDATED_BY_ADMIN',
      resourceType: 'support_ticket',
      resourceId: updatedTicket.id,
      details: { status },
    });

    await this.notifications.notifyUser(targetUserId, {
      title: `Réclamation ${updatedTicket.ticketNumber} mise à jour`,
      body: `Statut actuel : ${updatedTicket.statusLabel}.`,
      type: 'SUPPORT_REPLY',
      resourceId: updatedTicket.id,
    });

    return updatedTicket;
  }

  private mapDbTicket(t: any): SupportTicket {
    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      userId: t.userId,
      transactionId: t.transactionId || undefined,
      category: t.category as TicketCategory,
      categoryLabel: this.categoryLabel(t.category as TicketCategory),
      title: t.title,
      description: t.description,
      status: t.status as TicketStatus,
      statusLabel: this.statusLabel(t.status as TicketStatus),
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
      resolutionNotes: t.resolutionNotes || undefined,
      messages: (t.messages || []).map((m: any) => ({
        id: m.id,
        senderType: m.senderType,
        senderName: m.senderName,
        content: m.content,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
      })),
    };
  }
}
