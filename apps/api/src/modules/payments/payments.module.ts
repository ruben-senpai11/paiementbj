import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { CatalogModule } from '../catalog/catalog.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [CatalogModule, ProvidersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
