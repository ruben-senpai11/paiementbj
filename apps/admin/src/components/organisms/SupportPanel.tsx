import React from 'react';
import { SupportTicket, TicketStatus } from '@paiementbj/types';
import { AdminButton } from '../atoms/AdminButton';
import { AdminStatusBadge } from '../atoms/AdminStatusBadge';
import { AdminField } from '../molecules/AdminField';

interface SupportPanelProps {
  tickets: SupportTicket[];
  ticketDrafts: Record<string, { status: TicketStatus; resolutionNotes: string }>;
  onChangeDraft: (
    ticketId: string,
    draft: { status: TicketStatus; resolutionNotes: string }
  ) => void;
  onSaveTicket: (ticketId: string) => void;
}

const TICKET_STATUS_OPTIONS: Array<{ value: TicketStatus; label: string }> = [
  { value: 'OPEN', label: 'Ouverte' },
  { value: 'INVESTIGATING', label: 'En instruction' },
  { value: 'RESOLVED', label: 'Résolue' },
  { value: 'CLOSED', label: 'Clôturée' },
];

export function SupportPanel({
  tickets,
  ticketDrafts,
  onChangeDraft,
  onSaveTicket,
}: SupportPanelProps) {
  return (
    <section className="pbj-admin-card" aria-labelledby="support-title">
      <h3 id="support-title" className="pbj-admin-card__title">
        Dossiers de réclamation ({tickets.length})
      </h3>
      {tickets.length === 0 ? (
        <p className="pbj-admin-empty">Aucune réclamation enregistrée.</p>
      ) : (
        <div className="pbj-admin-ticket-list">
          {tickets.map((ticket) => {
            const draft = ticketDrafts[ticket.id] || {
              status: ticket.status,
              resolutionNotes: ticket.resolutionNotes || '',
            };
            return (
              <article key={ticket.id} className="pbj-admin-ticket">
                <div className="pbj-admin-card__head">
                  <div>
                    <code>{ticket.ticketNumber}</code> — <strong>{ticket.title}</strong>
                    <div className="pbj-admin-table__sub">
                      {ticket.categoryLabel} • {new Date(ticket.createdAt).toLocaleString('fr-BJ')}
                    </div>
                  </div>
                  <AdminStatusBadge status={ticket.status} label={ticket.statusLabel} />
                </div>

                <p className="pbj-admin-ticket__desc">{ticket.description}</p>

                {ticket.messages.length > 1 && (
                  <div className="pbj-admin-ticket__thread">
                    {ticket.messages.slice(1).map((message) => (
                      <div key={message.id}>
                        <strong>{message.senderName} :</strong> {message.content}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pbj-admin-ticket__actions">
                  <AdminField id={`st-${ticket.id}`} label="Statut">
                    <select
                      id={`st-${ticket.id}`}
                      value={draft.status}
                      onChange={(e) =>
                        onChangeDraft(ticket.id, {
                          ...draft,
                          status: e.target.value as TicketStatus,
                        })
                      }
                      className="pbj-admin-select pbj-admin-select--compact"
                    >
                      {TICKET_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </AdminField>

                  <div style={{ flex: 2, minWidth: 220 }}>
                    <AdminField id={`note-${ticket.id}`} label="Note de réponse">
                      <input
                        id={`note-${ticket.id}`}
                        type="text"
                        value={draft.resolutionNotes}
                        placeholder="Réponse transmise à l’usager"
                        onChange={(e) =>
                          onChangeDraft(ticket.id, {
                            ...draft,
                            resolutionNotes: e.target.value,
                          })
                        }
                        className="pbj-admin-input pbj-admin-input--compact"
                      />
                    </AdminField>
                  </div>

                  <AdminButton
                    type="button"
                    tone="royal"
                    size="sm"
                    onClick={() => onSaveTicket(ticket.id)}
                  >
                    Enregistrer
                  </AdminButton>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
