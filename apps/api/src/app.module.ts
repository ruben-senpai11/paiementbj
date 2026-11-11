import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { SupportModule } from './modules/support/support.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    NotificationsModule,
    AuthModule,
    CatalogModule,
    ProvidersModule,
    PaymentsModule,
    TransactionsModule,
    SupportModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
