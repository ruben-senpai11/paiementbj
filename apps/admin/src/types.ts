export type AdminTab = 'overview' | 'transactions' | 'catalog' | 'support' | 'audit';

export type TransactionStatusFilter = 'ALL' | 'SUCCEEDED' | 'PENDING' | 'FAILED';

export interface AdminStatsData {
  usersCount: number;
  transactionsCount: number;
  volumeTotal: number;
  openTicketsCount: number;
  providersSummary: Array<{
    code: string;
    name: string;
    availability: string;
    message?: string;
  }>;
}
