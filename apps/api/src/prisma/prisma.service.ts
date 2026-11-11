import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private available = false;
  private lastProbeAt = 0;

  async onModuleInit() {
    this.lastProbeAt = Date.now();
    try {
      await this.$connect();
      this.available = true;
      console.log('[PrismaService] Connexion réussie à la base de données PostgreSQL.');
    } catch (err: any) {
      this.available = false;
      console.warn(
        '[PrismaService] Avertissement : Impossible de se connecter immédiatement à PostgreSQL.',
        err.message
      );
    }
  }

  /**
   * Évite de déclencher un timeout TCP Prisma à chaque requête lorsque la base est hors ligne.
   * Retente automatiquement la connexion au bout de 30 secondes si nécessaire.
   */
  async checkAvailable(): Promise<boolean> {
    if (this.available) {
      return true;
    }
    const now = Date.now();
    if (now - this.lastProbeAt < 30_000) {
      return false;
    }
    this.lastProbeAt = now;
    try {
      await this.$connect();
      this.available = true;
      return true;
    } catch {
      this.available = false;
      return false;
    }
  }

  markUnavailable(): void {
    this.available = false;
    this.lastProbeAt = Date.now();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
