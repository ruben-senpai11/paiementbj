import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaymentProviderCode,
  PaymentQuote,
  PaymentValidationResult,
  ProviderSummary,
} from '@paiementbj/types';
import { PaymentProviderAdapter } from './adapters/payment-provider.adapter';
import { MtnMomoAdapter } from './adapters/mtn-momo.adapter';
import { MoovMoneyAdapter } from './adapters/moov-money.adapter';
import { CeltiisCashAdapter } from './adapters/celtiis-cash.adapter';
import { BankCardAdapter } from './adapters/bank-card.adapter';
import { TresorPayAdapter } from './adapters/tresor-pay.adapter';

@Injectable()
export class ProvidersService {
  private readonly adapters = new Map<PaymentProviderCode, PaymentProviderAdapter>();

  constructor(
    private readonly mtnMomo: MtnMomoAdapter,
    private readonly moovMoney: MoovMoneyAdapter,
    private readonly celtiisCash: CeltiisCashAdapter,
    private readonly bankCard: BankCardAdapter,
    private readonly tresorPay: TresorPayAdapter
  ) {
    this.adapters.set('MTN_MOMO', this.mtnMomo);
    this.adapters.set('MOOV_MONEY', this.moovMoney);
    this.adapters.set('CELTIIS_CASH', this.celtiisCash);
    this.adapters.set('BANK_CARD', this.bankCard);
    this.adapters.set('TRESOR_PAY', this.tresorPay);
  }

  getAdapter(code: PaymentProviderCode): PaymentProviderAdapter {
    const adapter = this.adapters.get(code);
    if (!adapter) {
      throw new NotFoundException(`Prestataire de paiement non reconnu : ${code}`);
    }
    return adapter;
  }

  async listProviders(): Promise<ProviderSummary[]> {
    const list: ProviderSummary[] = [];
    for (const [code, adapter] of this.adapters.entries()) {
      const avail = await adapter.getAvailability();
      list.push({
        code,
        name: adapter.name,
        capabilities: adapter.getCapabilities(),
        availability: avail.status,
        statusMessage: avail.message,
        brandAssetKey:
          code === 'MTN_MOMO'
            ? 'mtnMoMo'
            : code === 'MOOV_MONEY'
            ? 'moovMoney'
            : code === 'CELTIIS_CASH'
            ? 'celtiisCash'
            : code === 'BANK_CARD'
            ? 'visa'
            : 'tresor',
      });
    }
    return list;
  }

  async getQuote(
    serviceId: string,
    providerCode: PaymentProviderCode,
    amount: number,
    currency: 'XOF' | 'EUR' | 'USD' = 'XOF'
  ): Promise<PaymentQuote> {
    const adapter = this.getAdapter(providerCode);
    return await adapter.getPaymentQuote(serviceId, amount, currency);
  }

  async validatePayment(params: {
    serviceId: string;
    providerCode: PaymentProviderCode;
    serviceReference: string;
    amount?: number;
  }): Promise<PaymentValidationResult> {
    const adapter = this.getAdapter(params.providerCode);
    return await adapter.validatePayment(params);
  }
}
