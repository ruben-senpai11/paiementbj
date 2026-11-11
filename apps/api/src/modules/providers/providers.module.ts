import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { MtnMomoAdapter } from './adapters/mtn-momo.adapter';
import { MoovMoneyAdapter } from './adapters/moov-money.adapter';
import { CeltiisCashAdapter } from './adapters/celtiis-cash.adapter';
import { BankCardAdapter } from './adapters/bank-card.adapter';
import { TresorPayAdapter } from './adapters/tresor-pay.adapter';

@Module({
  providers: [
    MtnMomoAdapter,
    MoovMoneyAdapter,
    CeltiisCashAdapter,
    BankCardAdapter,
    TresorPayAdapter,
    ProvidersService,
  ],
  exports: [ProvidersService],
})
export class ProvidersModule {}
