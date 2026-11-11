import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PaymentsModule } from '../payments/payments.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [PaymentsModule, CatalogModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
