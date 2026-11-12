import React from 'react';
import { AuditLog } from '@paiementbj/types';

interface AuditPanelProps {
  auditLogs: AuditLog[];
}

export function AuditPanel({ auditLogs }: AuditPanelProps) {
  return (
    <section className="pbj-admin-card" aria-labelledby="audit-title">
      <h3 id="audit-title" className="pbj-admin-card__title">
        Journal d’audit ({auditLogs.length})
      </h3>
      {auditLogs.length > 0 ? (
        <div className="pbj-admin-table-wrap">
          <table className="pbj-admin-table">
            <thead>
              <tr>
                <th scope="col">Horodatage</th>
                <th scope="col">Acteur</th>
                <th scope="col">Action</th>
                <th scope="col">Ressource</th>
                <th scope="col">Adresse IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString('fr-BJ')}</td>
                  <td>
                    {log.actorType} ({log.actorId ? log.actorId.slice(0, 10) : 'système'})
                  </td>
                  <td>
                    <code>{log.action}</code>
                  </td>
                  <td>
                    {log.resourceType}:{log.resourceId || '—'}
                  </td>
                  <td>{log.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="pbj-admin-empty">Aucun événement enregistré.</p>
      )}
    </section>
  );
}
