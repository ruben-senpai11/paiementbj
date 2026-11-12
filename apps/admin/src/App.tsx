import React, { useCallback, useEffect, useState } from 'react';
import {
  AdminUserInfo,
  AuditLog,
  IntegrationStatus,
  ServiceItem,
  SupportTicket,
  TicketStatus,
  TransactionSummary,
} from '@paiementbj/types';
import {
  ADMIN_API_BASE,
  adminApi,
  clearAdminSession,
  getStoredAdminSession,
  registerAdminUnauthorizedHandler,
  saveAdminSession,
} from './api';
import { AuditPanel } from './components/organisms/AuditPanel';
import { CatalogPanel } from './components/organisms/CatalogPanel';
import { OverviewPanel } from './components/organisms/OverviewPanel';
import { SupportPanel } from './components/organisms/SupportPanel';
import { TransactionsPanel } from './components/organisms/TransactionsPanel';
import { AdminDashboardTemplate } from './components/templates/AdminDashboardTemplate';
import { AdminLoginTemplate } from './components/templates/AdminLoginTemplate';
import { AdminStatsData, AdminTab, TransactionStatusFilter } from './types';

export default function App() {
  const initialSession = getStoredAdminSession();
  const [adminUser, setAdminUser] = useState<AdminUserInfo | null>(initialSession.admin);
  const [token, setToken] = useState<string | null>(initialSession.token);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [txStatusFilter, setTxStatusFilter] = useState<TransactionStatusFilter>('ALL');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [serviceStatusDraft, setServiceStatusDraft] = useState<Record<string, IntegrationStatus>>({});
  const [ticketDrafts, setTicketDrafts] = useState<
    Record<string, { status: TicketStatus; resolutionNotes: string }>
  >({});

  const handleLogout = useCallback(() => {
    clearAdminSession();
    setToken(null);
    setAdminUser(null);
    setStats(null);
    setTransactions([]);
    setTickets([]);
    setAuditLogs([]);
    setApiError(null);
  }, []);

  useEffect(() => {
    registerAdminUnauthorizedHandler(() => {
      handleLogout();
      setAuthError('Session expirée. Veuillez vous reconnecter.');
    });
  }, [handleLogout]);

  const loadTabData = useCallback(
    async (tab: AdminTab) => {
      if (!token) return;
      setLoadingData(true);
      setApiError(null);

      try {
        if (tab === 'overview') {
          const data = await adminApi.admin.getStats();
          setStats(data);
        } else if (tab === 'transactions') {
          const list = await adminApi.admin.listTransactions();
          setTransactions(list);
        } else if (tab === 'catalog') {
          const list = await adminApi.services.list();
          setServices(list);
          const draftMap: Record<string, IntegrationStatus> = {};
          for (const service of list) {
            draftMap[service.id] = service.integrationStatus;
          }
          setServiceStatusDraft(draftMap);
        } else if (tab === 'support') {
          const list = await adminApi.admin.listTickets();
          setTickets(list);
          const draftMap: Record<string, { status: TicketStatus; resolutionNotes: string }> = {};
          for (const ticket of list) {
            draftMap[ticket.id] = {
              status: ticket.status,
              resolutionNotes: ticket.resolutionNotes || '',
            };
          }
          setTicketDrafts(draftMap);
        } else if (tab === 'audit') {
          const list = await adminApi.admin.getAuditLogs();
          setAuditLogs(list);
        }
      } catch (err: any) {
        setApiError(err?.message || `Impossible de joindre ${ADMIN_API_BASE}.`);
      } finally {
        setLoadingData(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      void loadTabData(activeTab);
    }
  }, [token, activeTab, loadTabData]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoggingIn(true);
    try {
      const res = await adminApi.admin.login(email.trim(), password);
      saveAdminSession(res.accessToken, res.admin);
      setToken(res.accessToken);
      setAdminUser(res.admin);
      setPassword('');
    } catch (err: any) {
      setAuthError(err?.message || 'Identifiants invalides.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSaveServiceStatus = async (serviceId: string) => {
    const status = serviceStatusDraft[serviceId];
    if (!status) return;
    setFeedbackMessage(null);
    setApiError(null);
    try {
      await adminApi.admin.updateServiceStatus(serviceId, status);
      setFeedbackMessage(`Statut du service ${serviceId} mis à jour.`);
      await loadTabData('catalog');
    } catch (err: any) {
      setApiError(err?.message || 'Impossible de modifier le statut du service.');
    }
  };

  const handleUpdateTicket = async (ticketId: string) => {
    const draft = ticketDrafts[ticketId];
    if (!draft) return;
    setFeedbackMessage(null);
    setApiError(null);
    try {
      await adminApi.admin.updateTicket(ticketId, {
        status: draft.status,
        resolutionNotes: draft.resolutionNotes.trim() || undefined,
      });
      setFeedbackMessage(`Dossier ${ticketId} mis à jour.`);
      await loadTabData('support');
    } catch (err: any) {
      setApiError(err?.message || 'Impossible de mettre à jour ce dossier.');
    }
  };

  if (!token || !adminUser) {
    return (
      <AdminLoginTemplate
        email={email}
        password={password}
        loggingIn={loggingIn}
        authError={authError}
        onChangeEmail={setEmail}
        onChangePassword={setPassword}
        onSubmit={handleLoginSubmit}
      />
    );
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (txStatusFilter === 'ALL') return true;
    if (txStatusFilter === 'PENDING') {
      return tx.status === 'PENDING' || tx.status === 'PROCESSING';
    }
    return tx.status === txStatusFilter;
  });

  return (
    <AdminDashboardTemplate
      activeTab={activeTab}
      adminUser={adminUser}
      loadingData={loadingData}
      feedbackMessage={feedbackMessage}
      apiError={apiError}
      onSelectTab={setActiveTab}
      onRefresh={() => void loadTabData(activeTab)}
      onLogout={handleLogout}
    >
      {activeTab === 'overview' && <OverviewPanel stats={stats} />}

      {activeTab === 'transactions' && (
        <TransactionsPanel
          transactions={filteredTransactions}
          statusFilter={txStatusFilter}
          onChangeFilter={setTxStatusFilter}
        />
      )}

      {activeTab === 'catalog' && (
        <CatalogPanel
          services={services}
          serviceStatusDraft={serviceStatusDraft}
          onChangeDraft={(serviceId, status) =>
            setServiceStatusDraft((prev) => ({ ...prev, [serviceId]: status }))
          }
          onSaveStatus={(serviceId) => void handleSaveServiceStatus(serviceId)}
        />
      )}

      {activeTab === 'support' && (
        <SupportPanel
          tickets={tickets}
          ticketDrafts={ticketDrafts}
          onChangeDraft={(ticketId, draft) =>
            setTicketDrafts((prev) => ({ ...prev, [ticketId]: draft }))
          }
          onSaveTicket={(ticketId) => void handleUpdateTicket(ticketId)}
        />
      )}

      {activeTab === 'audit' && <AuditPanel auditLogs={auditLogs} />}
    </AdminDashboardTemplate>
  );
}
