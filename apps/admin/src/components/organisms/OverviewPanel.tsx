import React from 'react';
import { formatFCFA } from '@paiementbj/shared';
import { AdminStatusBadge } from '../atoms/AdminStatusBadge';
import { AdminMetricCard } from '../molecules/AdminMetricCard';
import { AdminStatsData } from '../../types';

interface OverviewPanelProps {
  stats: AdminStatsData | null;
}

export function OverviewPanel({ stats }: OverviewPanelProps) {
  return (
    <div>
      <div className="pbj-admin-metrics-grid">
        <AdminMetricCard
          label="Comptes usagers"
          value={stats?.usersCount ?? 0}
          footnote="Inscriptions validées"
        />
        <AdminMetricCard
          label="Transactions"
          value={stats?.transactionsCount ?? 0}
          footnote="Opérations enregistrées"
        />
        <AdminMetricCard
          label="Volume confirmé"
          value={formatFCFA(stats?.volumeTotal ?? 0)}
          footnote="Règlements validés"
          tone="success"
        />
        <AdminMetricCard
          label="Réclamations"
          value={stats?.openTicketsCount ?? 0}
          footnote="Dossiers ouverts"
          tone="warning"
        />
      </div>

      <section className="pbj-admin-card" aria-labelledby="providers-health-title">
        <h3 id="providers-health-title" className="pbj-admin-card__title">
          Canaux de paiement
        </h3>
        {stats?.providersSummary && stats.providersSummary.length > 0 ? (
          <div className="pbj-admin-table-wrap">
            <table className="pbj-admin-table">
              <thead>
                <tr>
                  <th scope="col">Canal</th>
                  <th scope="col">Code</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Information</th>
                </tr>
              </thead>
              <tbody>
                {stats.providersSummary.map((provider) => (
                  <tr key={provider.code}>
                    <td>
                      <strong>{provider.name}</strong>
                    </td>
                    <td>
                      <code>{provider.code}</code>
                    </td>
                    <td>
                      <AdminStatusBadge status={provider.availability} />
                    </td>
                    <td>{provider.message || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="pbj-admin-empty">Aucune donnée disponible pour le moment.</p>
        )}
      </section>
    </div>
  );
}
