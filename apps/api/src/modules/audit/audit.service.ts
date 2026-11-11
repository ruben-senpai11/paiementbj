import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogParams {
  actorId?: string;
  actorType: 'USER' | 'ADMIN' | 'SYSTEM' | 'PROVIDER';
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly inMemoryLogs: Array<Record<string, unknown>> = [];

  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    this.logger.log(
      `[AUDIT] Actor: ${params.actorType} (${params.actorId || 'anon'}) - Action: ${params.action} - Resource: ${params.resourceType}:${params.resourceId || ''}`
    );

    const record = {
      id: `aud_${crypto.randomUUID()}`,
      actorId: params.actorId || 'system',
      actorType: params.actorType,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date().toISOString(),
    };

    this.inMemoryLogs.unshift(record);
    if (this.inMemoryLogs.length > 500) {
      this.inMemoryLogs.length = 500;
    }

    try {
      if (await this.prisma.checkAvailable()) {
        await this.prisma.auditLog.create({
          data: {
            actorId: params.actorId,
            actorType: params.actorType,
            action: params.action,
            resourceType: params.resourceType,
            resourceId: params.resourceId,
            details: params.details as any,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
          },
        });
      }
    } catch (err: any) {
      this.prisma.markUnavailable();
      // Si la base n'est pas encore migrée, conserve le journal réel de session en mémoire
      this.logger.warn(`AuditLog fallback mémoire/console: ${err.message}`);
    }
  }

  async getRecentLogs(limit = 50) {
    try {
      if (await this.prisma.checkAvailable()) {
        const dbLogs = await this.prisma.auditLog.findMany({
          take: limit,
          orderBy: { timestamp: 'desc' },
        });
        if (dbLogs.length > 0) {
          return dbLogs;
        }
      }
    } catch {
      this.prisma.markUnavailable();
      // Fallback sur le journal réel enregistré en mémoire durant la session
    }
    return this.inMemoryLogs.slice(0, limit);
  }
}
