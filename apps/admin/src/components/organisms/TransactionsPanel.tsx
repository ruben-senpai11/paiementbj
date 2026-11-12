import React from 'react';
import { formatFCFA } from '@paiementbj/shared';
import { TransactionSummary } from '@paiementbj/types';
import { AdminStatusBadge } from '../atoms/AdminStatusBadge';
import { TransactionStatusFilter } from '../../types';

interface TransactionsPanelProps {
  transactions: TransactionSummary[];
  statusFilter: TransactionStatusFilter;
  onChangeFilter: (filter: TransactionStatusFilter) => void;
}

const FILTER_OPTIONS: Array<{ key: TransactionStatusFilter; label: string }> = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'SUCCEEDED', label: 'Confirmées' },
  { key: 'PENDING', label: 'En cours' },
  { key: 'FAILED', label: 'Échouées' },
];

export function TransactionsPanel({
  transactions,
  statusFilter,
  onChangeFilter,
}: TransactionsPanelProps) {
  return (
    <section className="pbj-admin-card" aria-labelledby="tx-title">
      <div className="pbj-admin-card__head">
        <h3 id="tx-title" className="pbj-admin-card__title">
          Journal des opérations ({transactions.length})
        </h3>
        <div className="pbj-admin-chip-group" role="group" aria-label="Filtrer par statut">
          {FILTER_OPTIONS.map((item) => {
            const active = statusFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChangeFilter(item.key)}
                className={`pbj-admin-chip${active ? ' pbj-admin-chip--active' : ''}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="pbj-admin-empty">Aucune opération pour ce filtre.</p>
      ) : (
        <div className="pbj-admin-table-wrap">
          <table className="pbj-admin-table">
            <thead>
              <tr>
                <th scope="col">Référence</th>
                <th scope="col">Service</th>
                <th scope="col">Canal</th>
                <th scope="col">Montant total</th>
                <th scope="col">Statut</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <code>{tx.reference}</code>
                  </td>
                  <td>
                    <strong>{tx.serviceTitle}</strong>
                    <div className="pbj-admin-table__sub">{tx.beneficiaryName}</div>
                  </td>
                  <td>
                    <code>{tx.providerCode}</code>
                    {tx.providerReference && (
                      <div className="pbj-admin-table__sub">{tx.providerReference}</div>
                    )}
                  </td>
                  <td>
                    <strong>{formatFCFA(tx.totalAmount)}</strong>
                    <div className="pbj-admin-table__sub">
                      {formatFCFA(tx.amountPrincipal)} + {formatFCFA(tx.providerFee)}
                    </div>
                  </td>
                  <td>
                    <AdminStatusBadge status={tx.status} label={tx.statusLabel || tx.status} />
                  </td>
                  <td>{new Date(tx.initiatedAt).toLocaleString('fr-BJ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
