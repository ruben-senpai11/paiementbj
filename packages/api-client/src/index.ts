import {
  User,
  DeviceSession,
  ConsentRecord,
  NotificationItem,
  AdminLoginResponse,
  ServiceItem,
  TransactionSummary,
  Receipt,
  PaymentIntent,
  PaymentQuote,
  PaymentSessionResponse,
  PaymentValidationResult,
  ProviderSummary,
  SupportTicket,
  ProviderStatusCheckResponse,
  AuditLog,
} from '@paiementbj/types';
import {
  RequestOtpDto,
  VerifyOtpDto,
  ConsentDto,
  UpdateProfileDto,
  RequestAccountDeletionDto,
  CreatePaymentIntentDto,
  CreatePaymentAttemptDto,
  PaymentQuoteDto,
  ValidatePaymentDto,
  CreateSupportTicketDto,
  ServiceQueryDto,
} from '@paiementbj/schemas';

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class PaiementBjApiClient {
  private baseUrl: string;
  private getToken?: () => Promise<string | null>;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.onUnauthorized?.();
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        throw new ApiError(
          response.status,
          errorData.code || 'HTTP_ERROR',
          errorData.message || 'Une erreur réseau est survenue. Vérifiez votre connexion.',
          errorData
        );
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Vérifiez votre connexion Internet et réessayez.'
      );
    }
  }

  // --- AUTH ---
  public auth = {
    requestOtp: (data: RequestOtpDto) =>
      this.request<{ message: string; expiresInSeconds: number; devOtpCode?: string }>(
        '/auth/otp/request',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    verifyOtp: (data: VerifyOtpDto) =>
      this.request<{ accessToken: string; refreshToken: string; user: User }>(
        '/auth/otp/verify',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    getMe: () => this.request<User>('/auth/me'),

    updateProfile: (data: UpdateProfileDto) =>
      this.request<User>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    getSessions: () => this.request<DeviceSession[]>('/auth/sessions'),

    revokeSession: (deviceId: string) =>
      this.request<{ success: boolean }>('/auth/sessions/revoke', {
        method: 'POST',
        body: JSON.stringify({ deviceId }),
      }),

    getConsents: () => this.request<ConsentRecord[]>('/auth/consents'),

    recordConsent: (data: ConsentDto) =>
      this.request<ConsentRecord>('/auth/consents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    requestAccountDeletion: (data: RequestAccountDeletionDto) =>
      this.request<{ accepted: boolean; scheduledAt: string; message: string }>(
        '/auth/account/delete-request',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
  };

  // --- SERVICES CATALOG ---
  public services = {
    list: (query?: Partial<ServiceQueryDto>) => {
      const params = new URLSearchParams();
      if (query?.category) params.append('category', query.category);
      if (query?.q) params.append('q', query.q);
      if (query?.status) params.append('status', query.status);
      const qs = params.toString();
      return this.request<ServiceItem[]>(`/services${qs ? `?${qs}` : ''}`);
    },

    getById: (id: string) => this.request<ServiceItem>(`/services/${id}`),
  };

  // --- PAYMENTS & ORCHESTRATION ---
  public payments = {
    listProviders: () => this.request<ProviderSummary[]>('/payments/providers'),

    getQuote: (data: PaymentQuoteDto) =>
      this.request<PaymentQuote>('/payments/quote', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    validatePayment: (data: ValidatePaymentDto) =>
      this.request<PaymentValidationResult>('/payments/validate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    createIntent: (data: CreatePaymentIntentDto) =>
      this.request<PaymentIntent>('/payments/intents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    createAttempt: (data: CreatePaymentAttemptDto) =>
      this.request<PaymentSessionResponse>('/payments/attempts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getStatus: (paymentIntentId: string) =>
      this.request<ProviderStatusCheckResponse>(`/payments/intents/${paymentIntentId}/status`),

    verifyReceipt: (reference: string) =>
      this.request<{
        found: boolean;
        receipt?: {
          receiptNumber: string;
          beneficiaryName: string;
          serviceTitle: string;
          serviceReference: string;
          totalAmount: number;
          currency: string;
          providerName: string;
          issuedAt: string;
          isVerified: boolean;
          digitalSignatureHash: string;
        };
      }>(`/payments/receipts/verify?reference=${encodeURIComponent(reference)}`),
  };

  // --- TRANSACTIONS & RECEIPTS ---
  public transactions = {
    list: () => this.request<TransactionSummary[]>('/transactions'),

    getById: (id: string) => this.request<TransactionSummary>(`/transactions/${id}`),

    getReceipt: (transactionId: string) =>
      this.request<Receipt>(`/transactions/${transactionId}/receipt`),
  };

  // --- NOTIFICATIONS ---
  public notifications = {
    list: () => this.request<NotificationItem[]>('/notifications'),

    markRead: (id: string) =>
      this.request<{ success: boolean }>(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
  };

  // --- SUPPORT & COMPLAINTS ---
  public support = {
    createTicket: (data: CreateSupportTicketDto) =>
      this.request<SupportTicket>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    listTickets: () => this.request<SupportTicket[]>('/support/tickets'),

    getTicket: (id: string) => this.request<SupportTicket>(`/support/tickets/${id}`),

    addMessage: (ticketId: string, content: string) =>
      this.request<SupportTicket>(`/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  };

  // --- ADMIN BACK-OFFICE ---
  public admin = {
    login: (email: string, password: string) =>
      this.request<AdminLoginResponse>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    getStats: () =>
      this.request<{
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
      }>('/admin/stats'),

    getAuditLogs: () => this.request<AuditLog[]>('/admin/audit-logs'),

    listTransactions: () => this.request<TransactionSummary[]>('/admin/transactions'),

    updateServiceStatus: (id: string, status: string) =>
      this.request<{ id: string; integrationStatus: string }>(`/admin/services/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    listTickets: () => this.request<SupportTicket[]>('/admin/support/tickets'),

    updateTicket: (id: string, data: { status: string; resolutionNotes?: string }) =>
      this.request<SupportTicket>(`/admin/support/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };
}
