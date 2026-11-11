import React, { useCallback, useEffect, useState } from 'react';
import { formatFCFA } from '@paiementbj/shared';
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

type AdminTab = 'overview' | 'transactions' | 'catalog' | 'support' | 'audit';

interface AdminStatsData {
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

const INTEGRATION_STATUS_OPTIONS: Array<{ value: IntegrationStatus; label: string }> = [
  { value: 'LIVE', label: 'LIVE (Production active)' },
  { value: 'SANDBOX_CONNECTED', label: 'SANDBOX_CONNECTED (Bac à sable raccordé)' },
  { value: 'PENDING_AGREEMENT', label: 'PENDING_AGREEMENT (En attente de convention)' },
  { value: 'TECHNICAL_IN_PROGRESS', label: 'TECHNICAL_IN_PROGRESS (Intégration technique)' },
  { value: 'UNAVAILABLE', label: 'UNAVAILABLE (Suspendu / indisponible)' },
];

const TICKET_STATUS_OPTIONS: Array<{ value: TicketStatus; label: string }> = [
  { value: 'OPEN', label: 'Ouverte' },
  { value: 'INVESTIGATING', label: 'En cours d’instruction' },
  { value: 'RESOLVED', label: 'Résolue' },
  { value: 'CLOSED', label: 'Clôturée' },
];

function badgePaletteForStatus(status: string): { bg: string; fg: string; text: string } {
  switch (status) {
    case 'OPERATIONAL':
    case 'LIVE':
    case 'SUCCEEDED':
    case 'RESOLVED':
      return { bg: '#E6F4EC', fg: '#0A522E', text: status };
    case 'SANDBOX_CONNECTED':
      return { bg: '#E6F4EC', fg: '#0A522E', text: 'Bac à sable raccordé' };
    case 'PENDING':
    case 'PROCESSING':
    case 'INVESTIGATING':
    case 'PENDING_AGREEMENT':
    case 'TECHNICAL_IN_PROGRESS':
      return { bg: '#FFF4D6', fg: '#6B3B00', text: status };
    case 'UNAVAILABLE':
    case 'FAILED':
    case 'CLOSED':
    default:
      return { bg: '#FCE8E8', fg: '#8A1919', text: status };
  }
}

export default function App() {
  const initialSession = getStoredAdminSession();
  const [adminUser, setAdminUser] = useState<AdminUserInfo | null>(initialSession.admin);
  const [token, setToken] = useState<string | null>(initialSession.token);

  // Formulaire de connexion
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Navigation et données réelles
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [txStatusFilter, setTxStatusFilter] = useState<'ALL' | 'SUCCEEDED' | 'PENDING' | 'FAILED'>('ALL');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // États d'édition back-office
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
      setAuthError('Session administrateur expirée ou révoquée. Veuillez vous reconnecter.');
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
          for (const s of list) {
            draftMap[s.id] = s.integrationStatus;
          }
          setServiceStatusDraft(draftMap);
        } else if (tab === 'support') {
          const list = await adminApi.admin.listTickets();
          setTickets(list);
          const draftMap: Record<string, { status: TicketStatus; resolutionNotes: string }> = {};
          for (const tk of list) {
            draftMap[tk.id] = {
              status: tk.status,
              resolutionNotes: tk.resolutionNotes || '',
            };
          }
          setTicketDrafts(draftMap);
        } else if (tab === 'audit') {
          const list = await adminApi.admin.getAuditLogs();
          setAuditLogs(list);
        }
      } catch (err: any) {
        setApiError(
          err?.message ||
            `Impossible de charger les données depuis ${ADMIN_API_BASE}. Aucune donnée simulée n’est affichée.`
        );
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
      setAuthError(
        err?.message || 'Authentification refusée. Vérifiez vos identifiants opérateur.'
      );
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
      setFeedbackMessage(`Statut du service ${serviceId} mis à jour vers ${status}.`);
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
      setFeedbackMessage(`Dossier ${ticketId} mis à jour (${draft.status}).`);
      await loadTabData('support');
    } catch (err: any) {
      setApiError(err?.message || 'Impossible de mettre à jour ce ticket.');
    }
  };

  // --- ÉCRAN DE CONNEXION RBAC ---
  if (!token || !adminUser) {
    return (
      <div style={styles.loginPage}>
        <main style={styles.loginCard} aria-labelledby="admin-login-title">
          <div style={styles.flagBar} aria-hidden="true">
            <div style={{ flex: 1, backgroundColor: '#008751' }} />
            <div style={{ flex: 1, backgroundColor: '#FCD116' }} />
            <div style={{ flex: 1, backgroundColor: '#E8112D' }} />
          </div>
          <h1 id="admin-login-title" style={styles.loginTitle}>
            Paiement BJ — Back-Office Gouvernance
          </h1>
          <p style={styles.loginSubtitle}>
            Accès réservé aux opérateurs habilités, auditeurs et agents support (RBAC).
          </p>

          {authError && (
            <div role="alert" style={styles.alertError}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={styles.loginForm}>
            <div style={styles.fieldGroup}>
              <label htmlFor="admin-email" style={styles.label}>
                Adresse e-mail professionnelle
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@paiementbj.gouv.bj"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label htmlFor="admin-password" style={styles.label}>
                Mot de passe opérateur
              </label>
              <input
                id="admin-password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loggingIn} style={styles.primaryBtn}>
              {loggingIn ? 'Vérification...' : 'Ouvrir une session opérateur'}
            </button>
          </form>

          <div style={styles.loginNotice}>
            <strong>Architecture de sécurité :</strong> aucun compte par défaut codé en dur côté
            client. Utilisez un compte <code>AdminUser</code> en base ou configurez{' '}
            <code>ADMIN_BOOTSTRAP_EMAIL</code> et <code>ADMIN_BOOTSTRAP_PASSWORD_HASH</code> côté
            API.
          </div>
        </main>
      </div>
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
    <div className="admin-shell" style={styles.appContainer}>
      {/* Barre latérale institutionnelle */}
      <aside className="admin-sidebar" style={styles.sidebar}>
        <div style={styles.brandBox}>
          <div style={styles.flagBar} aria-hidden="true">
            <div style={{ flex: 1, backgroundColor: '#008751' }} />
            <div style={{ flex: 1, backgroundColor: '#FCD116' }} />
            <div style={{ flex: 1, backgroundColor: '#E8112D' }} />
          </div>
          <h1 style={styles.brandTitle}>Paiement BJ</h1>
          <p style={styles.brandSub}>Console d’Administration</p>
        </div>

        <nav aria-label="Navigation principale back-office" style={styles.nav}>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            aria-current={activeTab === 'overview' ? 'page' : undefined}
            style={{
              ...styles.navItem,
              ...(activeTab === 'overview' ? styles.navItemActive : {}),
            }}
          >
            Vue d’ensemble
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            aria-current={activeTab === 'transactions' ? 'page' : undefined}
            style={{
              ...styles.navItem,
              ...(activeTab === 'transactions' ? styles.navItemActive : {}),
            }}
          >
            Supervision transactions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            aria-current={activeTab === 'catalog' ? 'page' : undefined}
            style={{
              ...styles.navItem,
              ...(activeTab === 'catalog' ? styles.navItemActive : {}),
            }}
          >
            Catalogue des services
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            aria-current={activeTab === 'support' ? 'page' : undefined}
            style={{
              ...styles.navItem,
              ...(activeTab === 'support' ? styles.navItemActive : {}),
            }}
          >
            Réclamations usagers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            aria-current={activeTab === 'audit' ? 'page' : undefined}
            style={{
              ...styles.navItem,
              ...(activeTab === 'audit' ? styles.navItemActive : {}),
            }}
          >
            Journal d’audit & sécurité
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <p style={styles.footerNote}>Instruction BCEAO n°001-01-2024</p>
          <p style={styles.footerNote}>Zéro portefeuille interne</p>
          <p style={styles.footerNote}>API : {ADMIN_API_BASE}</p>
        </div>
      </aside>

      {/* Contenu principal */}
      <main style={styles.mainContent}>
        <header style={styles.topHeader}>
          <div>
            <h2 style={styles.pageTitle}>
              {activeTab === 'overview' && 'Tableau de bord de gouvernance'}
              {activeTab === 'transactions' && 'Supervision des transactions réelles'}
              {activeTab === 'catalog' && 'Gestion du catalogue officiel'}
              {activeTab === 'support' && 'Traitement des réclamations & litiges'}
              {activeTab === 'audit' && 'Piste d’audit et conformité (LBC/FT & APDP)'}
            </h2>
          </div>

          <div style={styles.headerActions}>
            <span style={styles.operatorTag}>
              {adminUser.name} ({adminUser.role})
            </span>
            <button
              type="button"
              onClick={() => void loadTabData(activeTab)}
              style={styles.secondaryBtn}
              disabled={loadingData}
            >
              {loadingData ? 'Actualisation...' : 'Actualiser'}
            </button>
            <button type="button" onClick={handleLogout} style={styles.secondaryBtn}>
              Déconnexion
            </button>
          </div>
        </header>

        {feedbackMessage && (
          <div role="status" style={styles.alertSuccess}>
            {feedbackMessage}
          </div>
        )}

        {apiError && (
          <div role="alert" style={styles.alertError}>
            <span>{apiError}</span>
          </div>
        )}

        {/* VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <div>
            <div className="metrics-grid" style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Comptes citoyens créés</span>
                <strong style={styles.metricValue}>{stats?.usersCount ?? 0}</strong>
                <span style={styles.metricFoot}>Vérification téléphone (Niveau 1)</span>
              </div>

              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Transactions enregistrées</span>
                <strong style={styles.metricValue}>{stats?.transactionsCount ?? 0}</strong>
                <span style={styles.metricFoot}>Intentions de paiement réelles</span>
              </div>

              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Volume total confirmé</span>
                <strong style={{ ...styles.metricValue, color: '#0A522E' }}>
                  {formatFCFA(stats?.volumeTotal ?? 0)}
                </strong>
                <span style={styles.metricFoot}>Règlements attestés SUCCEEDED</span>
              </div>

              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Réclamations ouvertes</span>
                <strong style={{ ...styles.metricValue, color: '#6B3B00' }}>
                  {stats?.openTicketsCount ?? 0}
                </strong>
                <span style={styles.metricFoot}>Dossiers usagers en attente</span>
              </div>
            </div>

            <section style={styles.card} aria-labelledby="providers-health-title">
              <h3 id="providers-health-title" style={styles.cardTitle}>
                État réel des passerelles partenaires
              </h3>
              {stats?.providersSummary && stats.providersSummary.length > 0 ? (
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col" style={styles.th}>Prestataire</th>
                        <th scope="col" style={styles.th}>Code</th>
                        <th scope="col" style={styles.th}>Disponibilité déclarée</th>
                        <th scope="col" style={styles.th}>Remarques d’intégration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.providersSummary.map((p) => {
                        const isOp = p.availability === 'OPERATIONAL';
                        return (
                          <tr key={p.code} style={styles.tr}>
                            <td style={styles.td}><strong>{p.name}</strong></td>
                            <td style={styles.td}><code>{p.code}</code></td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.badge,
                                  backgroundColor: isOp ? '#E6F4EC' : '#FCE8E8',
                                  color: isOp ? '#0A522E' : '#8A1919',
                                }}
                              >
                                {isOp ? 'Opérationnel' : 'Non disponible'}
                              </span>
                            </td>
                            <td style={styles.td}>{p.message || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={styles.emptyText}>
                  Aucune donnée de passerelle reçue tant que l’API n’a pas répondu.
                </p>
              )}
            </section>
          </div>
        )}

        {/* SUPERVISION TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <section style={styles.card} aria-labelledby="tx-title">
            <div style={styles.cardHeadBetween}>
              <h3 id="tx-title" style={styles.cardTitle}>
                Journal des opérations de paiement ({filteredTransactions.length})
              </h3>
              <div style={styles.filterGroup} role="group" aria-label="Filtrer par statut">
                {(
                  [
                    { key: 'ALL', label: 'Toutes' },
                    { key: 'SUCCEEDED', label: 'Confirmées' },
                    { key: 'PENDING', label: 'En cours' },
                    { key: 'FAILED', label: 'Échouées' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTxStatusFilter(item.key)}
                    style={{
                      ...styles.filterChip,
                      ...(txStatusFilter === item.key ? styles.filterChipActive : {}),
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <p style={styles.emptyText}>
                Aucune transaction réelle enregistrée pour ce filtre.
              </p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col" style={styles.th}>Référence</th>
                      <th scope="col" style={styles.th}>Service & Bénéficiaire</th>
                      <th scope="col" style={styles.th}>Prestataire</th>
                      <th scope="col" style={styles.th}>Montant total</th>
                      <th scope="col" style={styles.th}>Statut</th>
                      <th scope="col" style={styles.th}>Initiée le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const pal = badgePaletteForStatus(tx.status);
                      return (
                        <tr key={tx.id} style={styles.tr}>
                          <td style={styles.td}>
                            <code>{tx.reference}</code>
                          </td>
                          <td style={styles.td}>
                            <strong>{tx.serviceTitle}</strong>
                            <div style={styles.subText}>{tx.beneficiaryName}</div>
                          </td>
                          <td style={styles.td}>
                            <code>{tx.providerCode}</code>
                            {tx.providerReference && (
                              <div style={styles.subText}>{tx.providerReference}</div>
                            )}
                          </td>
                          <td style={styles.td}>
                            <strong>{formatFCFA(tx.totalAmount)}</strong>
                            <div style={styles.subText}>
                              Principal {formatFCFA(tx.amountPrincipal)} + frais {formatFCFA(tx.providerFee)}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, backgroundColor: pal.bg, color: pal.fg }}>
                              {tx.statusLabel || tx.status}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {new Date(tx.initiatedAt).toLocaleString('fr-BJ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* CATALOGUE DES SERVICES */}
        {activeTab === 'catalog' && (
          <section style={styles.card} aria-labelledby="catalog-title">
            <h3 id="catalog-title" style={styles.cardTitle}>
              Catalogue officiel & gouvernance d’activation ({services.length} services)
            </h3>
            <p style={styles.sectionNote}>
              Un service passé en <code>LIVE</code> ou <code>SANDBOX_CONNECTED</code> autorise la création d’intentions de paiement uniquement si la passerelle partenaire correspondante dispose d’une convention active.
            </p>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th scope="col" style={styles.th}>Code</th>
                    <th scope="col" style={styles.th}>Titre du service</th>
                    <th scope="col" style={styles.th}>Organisme bénéficiaire</th>
                    <th scope="col" style={styles.th}>Statut actuel</th>
                    <th scope="col" style={styles.th}>Action opérateur</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => {
                    const pal = badgePaletteForStatus(s.integrationStatus);
                    const draftStatus = serviceStatusDraft[s.id] || s.integrationStatus;
                    const dirty = draftStatus !== s.integrationStatus;
                    return (
                      <tr key={s.id} style={styles.tr}>
                        <td style={styles.td}><code>{s.code}</code></td>
                        <td style={styles.td}><strong>{s.title}</strong></td>
                        <td style={styles.td}>{s.organization?.name || 'Service public'}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, backgroundColor: pal.bg, color: pal.fg }}>
                            {s.integrationStatus}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.inlineControl}>
                            <select
                              aria-label={`Statut d’intégration pour ${s.title}`}
                              value={draftStatus}
                              onChange={(e) =>
                                setServiceStatusDraft((prev) => ({
                                  ...prev,
                                  [s.id]: e.target.value as IntegrationStatus,
                                }))
                              }
                              style={styles.select}
                            >
                              {INTEGRATION_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={!dirty}
                              onClick={() => void handleSaveServiceStatus(s.id)}
                              style={{
                                ...styles.smallBtn,
                                ...(!dirty ? styles.smallBtnDisabled : {}),
                              }}
                            >
                              Appliquer
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SUPPORT & RÉCLAMATIONS */}
        {activeTab === 'support' && (
          <section style={styles.card} aria-labelledby="support-title">
            <h3 id="support-title" style={styles.cardTitle}>
              Dossiers de réclamation usagers ({tickets.length})
            </h3>
            {tickets.length === 0 ? (
              <p style={styles.emptyText}>Aucune réclamation enregistrée pour le moment.</p>
            ) : (
              <div style={styles.ticketList}>
                {tickets.map((tk) => {
                  const pal = badgePaletteForStatus(tk.status);
                  const draft = ticketDrafts[tk.id] || {
                    status: tk.status,
                    resolutionNotes: tk.resolutionNotes || '',
                  };
                  return (
                    <article key={tk.id} style={styles.ticketCard}>
                      <div style={styles.cardHeadBetween}>
                        <div>
                          <code>{tk.ticketNumber}</code> — <strong>{tk.title}</strong>
                          <div style={styles.subText}>
                            Catégorie : {tk.categoryLabel} • Ouvert le{' '}
                            {new Date(tk.createdAt).toLocaleString('fr-BJ')}
                          </div>
                        </div>
                        <span style={{ ...styles.badge, backgroundColor: pal.bg, color: pal.fg }}>
                          {tk.statusLabel}
                        </span>
                      </div>

                      <p style={styles.ticketDesc}>{tk.description}</p>

                      {tk.messages.length > 1 && (
                        <div style={styles.threadBox}>
                          {tk.messages.slice(1).map((m) => (
                            <div key={m.id} style={styles.threadMsg}>
                              <strong>{m.senderName} :</strong> {m.content}
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={styles.ticketActions}>
                        <div style={styles.fieldCol}>
                          <label htmlFor={`st-${tk.id}`} style={styles.smallLabel}>
                            Statut du dossier
                          </label>
                          <select
                            id={`st-${tk.id}`}
                            value={draft.status}
                            onChange={(e) =>
                              setTicketDrafts((prev) => ({
                                ...prev,
                                [tk.id]: { ...draft, status: e.target.value as TicketStatus },
                              }))
                            }
                            style={styles.select}
                          >
                            {TICKET_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ ...styles.fieldCol, flex: 2 }}>
                          <label htmlFor={`note-${tk.id}`} style={styles.smallLabel}>
                            Note de réponse / résolution transmise à l’usager
                          </label>
                          <input
                            id={`note-${tk.id}`}
                            type="text"
                            value={draft.resolutionNotes}
                            placeholder="Ex: Rapprochement effectué auprès de l'opérateur..."
                            onChange={(e) =>
                              setTicketDrafts((prev) => ({
                                ...prev,
                                [tk.id]: { ...draft, resolutionNotes: e.target.value },
                              }))
                            }
                            style={styles.inputCompact}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleUpdateTicket(tk.id)}
                          style={styles.smallBtn}
                        >
                          Enregistrer
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* AUDIT */}
        {activeTab === 'audit' && (
          <section style={styles.card} aria-labelledby="audit-title">
            <h3 id="audit-title" style={styles.cardTitle}>
              Journal d’audit et de traçabilité ({auditLogs.length})
            </h3>
            <p style={styles.sectionNote}>
              Conforme aux exigences de journalisation sécurisée OWASP ASVS et de traçabilité APDP (Loi n°2017-20).
            </p>
            {auditLogs.length > 0 ? (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col" style={styles.th}>Horodatage</th>
                      <th scope="col" style={styles.th}>Acteur</th>
                      <th scope="col" style={styles.th}>Action</th>
                      <th scope="col" style={styles.th}>Ressource</th>
                      <th scope="col" style={styles.th}>Adresse IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={styles.tr}>
                        <td style={styles.td}>{new Date(log.timestamp).toLocaleString('fr-BJ')}</td>
                        <td style={styles.td}>
                          {log.actorType} ({log.actorId ? log.actorId.slice(0, 10) : 'anon'})
                        </td>
                        <td style={styles.td}><code>{log.action}</code></td>
                        <td style={styles.td}>
                          {log.resourceType}:{log.resourceId || '—'}
                        </td>
                        <td style={styles.td}>{log.ipAddress || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={styles.emptyText}>
                Aucun événement d’audit enregistré pour le moment.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loginPage: {
    minHeight: '100vh',
    backgroundColor: '#F5F8F4',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    border: '1.5px solid #D8E2DA',
    padding: 32,
  },
  loginTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: 22,
    fontWeight: 800,
    color: '#003F2B',
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#384C42',
    marginBottom: 20,
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#123B2F',
  },
  input: {
    minHeight: 48,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #003F2B',
    fontSize: 15,
    color: '#123B2F',
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    minHeight: 48,
    padding: '12px 18px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#064B32',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
  loginNotice: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EAF2EC',
    color: '#123B2F',
    fontSize: 12,
    lineHeight: 1.5,
  },
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F5F8F4',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#003F2B',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    flexShrink: 0,
  },
  brandBox: {
    marginBottom: 28,
  },
  flagBar: {
    display: 'flex',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: 48,
    marginBottom: 12,
  },
  brandTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: 22,
    fontWeight: 800,
    color: '#FFFFFF',
  },
  brandSub: {
    fontSize: 13,
    color: '#D4EADB',
    marginTop: 2,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    minHeight: 48,
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: '#EAF2EC',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'left',
  },
  navItemActive: {
    backgroundColor: '#064B32',
    borderColor: '#FFC52C',
    color: '#FFFFFF',
    fontWeight: 700,
  },
  sidebarFooter: {
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
    marginTop: 16,
  },
  footerNote: {
    fontSize: 12,
    color: '#D4EADB',
    lineHeight: 1.5,
  },
  mainContent: {
    flex: 1,
    padding: '32px 36px',
    overflowY: 'auto',
    minWidth: 0,
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  pageTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: 26,
    color: '#123B2F',
    fontWeight: 700,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  operatorTag: {
    backgroundColor: '#EAF2EC',
    color: '#064B32',
    padding: '8px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    border: '1px solid #D8E2DA',
  },
  secondaryBtn: {
    minHeight: 44,
    padding: '8px 14px',
    borderRadius: 8,
    border: '1.5px solid #064B32',
    backgroundColor: '#FFFFFF',
    color: '#064B32',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  alertError: {
    backgroundColor: '#FCE8E8',
    color: '#8A1919',
    border: '1.5px solid #8A1919',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 20,
  },
  alertSuccess: {
    backgroundColor: '#E6F4EC',
    color: '#0A522E',
    border: '1.5px solid #0A522E',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 20,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    border: '1.5px solid #D8E2DA',
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#384C42',
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: 28,
    fontWeight: 800,
    color: '#123B2F',
    marginBottom: 6,
  },
  metricFoot: {
    fontSize: 12,
    color: '#384C42',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    border: '1.5px solid #D8E2DA',
    marginBottom: 24,
  },
  cardTitle: {
    fontFamily: 'Outfit, sans-serif',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 14,
    color: '#123B2F',
  },
  sectionNote: {
    marginBottom: 16,
    fontSize: 14,
    color: '#384C42',
  },
  cardHeadBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  filterGroup: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    minHeight: 40,
    padding: '6px 12px',
    borderRadius: 8,
    border: '1.5px solid #D8E2DA',
    backgroundColor: '#F5F8F4',
    color: '#123B2F',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  filterChipActive: {
    backgroundColor: '#064B32',
    borderColor: '#064B32',
    color: '#FFFFFF',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 14px',
    borderBottom: '2px solid #D8E2DA',
    fontSize: 12,
    fontWeight: 700,
    color: '#384C42',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #EAEFEA',
  },
  td: {
    padding: '12px 14px',
    fontSize: 14,
    color: '#123B2F',
    verticalAlign: 'middle',
  },
  subText: {
    fontSize: 12,
    color: '#384C42',
    marginTop: 2,
  },
  badge: {
    padding: '5px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    display: 'inline-block',
  },
  inlineControl: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  select: {
    minHeight: 44,
    maxWidth: 225,
    padding: '6px 10px',
    borderRadius: 8,
    border: '1.5px solid #003F2B',
    backgroundColor: '#FFFFFF',
    color: '#123B2F',
    fontSize: 13,
    fontWeight: 600,
  },
  inputCompact: {
    minHeight: 44,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1.5px solid #003F2B',
    backgroundColor: '#FFFFFF',
    color: '#123B2F',
    fontSize: 14,
    width: '100%',
  },
  smallBtn: {
    minHeight: 44,
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#064B32',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  smallBtnDisabled: {
    backgroundColor: '#E2EAE3',
    color: '#2E3E37',
    cursor: 'not-allowed',
  },
  ticketList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  ticketCard: {
    border: '1.5px solid #D8E2DA',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#F5F8F4',
  },
  ticketDesc: {
    fontSize: 14,
    color: '#123B2F',
    marginBottom: 12,
  },
  threadBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #D8E2DA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  threadMsg: {
    fontSize: 13,
    color: '#123B2F',
    marginBottom: 4,
  },
  ticketActions: {
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 200,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#384C42',
  },
  emptyText: {
    padding: 24,
    textAlign: 'center',
    color: '#384C42',
    fontSize: 14,
  },
};
