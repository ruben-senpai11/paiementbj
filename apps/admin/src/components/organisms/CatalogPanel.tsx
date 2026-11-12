import React from 'react';
import { IntegrationStatus, ServiceItem } from '@paiementbj/types';
import { AdminButton } from '../atoms/AdminButton';
import { AdminStatusBadge } from '../atoms/AdminStatusBadge';

interface CatalogPanelProps {
  services: ServiceItem[];
  serviceStatusDraft: Record<string, IntegrationStatus>;
  onChangeDraft: (serviceId: string, status: IntegrationStatus) => void;
  onSaveStatus: (serviceId: string) => void;
}

const INTEGRATION_STATUS_OPTIONS: Array<{ value: IntegrationStatus; label: string }> = [
  { value: 'LIVE', label: 'Actif' },
  { value: 'SANDBOX_CONNECTED', label: 'Environnement de test' },
  { value: 'PENDING_AGREEMENT', label: 'En attente' },
  { value: 'TECHNICAL_IN_PROGRESS', label: 'En configuration' },
  { value: 'UNAVAILABLE', label: 'Indisponible' },
];

export function CatalogPanel({
  services,
  serviceStatusDraft,
  onChangeDraft,
  onSaveStatus,
}: CatalogPanelProps) {
  return (
    <section className="pbj-admin-card" aria-labelledby="catalog-title">
      <h3 id="catalog-title" className="pbj-admin-card__title">
        Services publics ({services.length})
      </h3>
      <div className="pbj-admin-table-wrap">
        <table className="pbj-admin-table">
          <thead>
            <tr>
              <th scope="col">Code</th>
              <th scope="col">Service</th>
              <th scope="col">Organisme</th>
              <th scope="col">Statut</th>
              <th scope="col">Modification</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => {
              const draftStatus = serviceStatusDraft[service.id] || service.integrationStatus;
              const dirty = draftStatus !== service.integrationStatus;
              return (
                <tr key={service.id}>
                  <td>
                    <code>{service.code}</code>
                  </td>
                  <td>
                    <strong>{service.title}</strong>
                  </td>
                  <td>{service.organization?.name || 'Service public'}</td>
                  <td>
                    <AdminStatusBadge status={service.integrationStatus} />
                  </td>
                  <td>
                    <div className="pbj-admin-inline-control">
                      <select
                        aria-label={`Statut pour ${service.title}`}
                        value={draftStatus}
                        onChange={(e) =>
                          onChangeDraft(service.id, e.target.value as IntegrationStatus)
                        }
                        className="pbj-admin-select pbj-admin-select--compact"
                      >
                        {INTEGRATION_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <AdminButton
                        type="button"
                        tone="royal"
                        size="sm"
                        disabled={!dirty}
                        onClick={() => onSaveStatus(service.id)}
                      >
                        Appliquer
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
