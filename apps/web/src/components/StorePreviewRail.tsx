import React from 'react';

interface PreviewScreen {
  id: string;
  caption: string;
  title: string;
  tag: string;
  tagTone: 'green' | 'blue' | 'amber';
  rows: Array<{ label: string; value: string; badge?: string; badgeTone?: 'green' | 'amber' }>;
  footerNote: string;
}

const PREVIEW_SCREENS: PreviewScreen[] = [
  {
    id: 'catalog',
    caption: '1. Catalogue centralisé',
    title: 'Tous les services publics et factures',
    tag: 'Interface unique',
    tagTone: 'green',
    rows: [
      { label: 'SBEE • Compteur ISAGO', value: 'Électricité prépayée', badge: 'Sandbox', badgeTone: 'amber' },
      { label: 'Trésor Public Bénin', value: 'Timbres & redevances', badge: 'Sandbox', badgeTone: 'amber' },
      { label: 'SONEB • Eau potable', value: 'Convention en cours', badge: 'Transparent', badgeTone: 'amber' },
    ],
    footerNote: 'Aucun portail dispersé à mémoriser',
  },
  {
    id: 'providers',
    caption: '2. Paiement direct',
    title: 'Vos fonds restent chez votre opérateur',
    tag: 'Zéro portefeuille',
    tagTone: 'blue',
    rows: [
      { label: 'MTN Mobile Money', value: 'Prélèvement direct +229', badge: 'Opérateur', badgeTone: 'green' },
      { label: 'Moov Money / Celtiis Cash', value: 'Fonds non retenus', badge: 'Opérateur', badgeTone: 'green' },
      { label: 'Cartes Visa / Mastercard', value: 'Diaspora & visiteurs', badge: 'Hébergé', badgeTone: 'green' },
    ],
    footerNote: 'Aucun rechargement ni solde Paiement BJ',
  },
  {
    id: 'receipt',
    caption: '3. Reçu vérifiable',
    title: 'Justificatif centralisé & horodaté',
    tag: 'Traçabilité',
    tagTone: 'green',
    rows: [
      { label: 'Statut transaction', value: 'Suivi temps réel (Webhook)' },
      { label: 'Référence prestataire', value: 'Centralisée au dossier' },
      { label: 'Empreinte d’intégrité', value: 'SHA-256 vérifiable' },
    ],
    footerNote: 'Historique et assistance réclamations',
  },
];

export const StorePreviewRail: React.FC = () => (
  <section className="store-section" aria-labelledby="preview-heading">
    <div className="section-head">
      <h2 id="preview-heading" className="section-title">
        Aperçu de l’application
      </h2>
      <span className="section-sub">Android · iOS · Web</span>
    </div>

    <div className="preview-rail" role="list" aria-label="Captures d’aperçu de l’application Paiement BJ">
      {PREVIEW_SCREENS.map((screen) => (
        <article key={screen.id} role="listitem" className="preview-card">
          <div className="phone-bezel">
            <div className="phone-notch" aria-hidden="true" />
            <div className="phone-screen">
              <div className="phone-top-row">
                <span className="phone-brand">Paiement BJ</span>
                <span className={`mini-pill mini-pill--${screen.tagTone}`}>{screen.tag}</span>
              </div>
              <h3 className="phone-title">{screen.title}</h3>
              <div className="phone-list">
                {screen.rows.map((row) => (
                  <div key={row.label} className="phone-row">
                    <div className="phone-row-text">
                      <span className="phone-row-label">{row.label}</span>
                      <span className="phone-row-val">{row.value}</span>
                    </div>
                    {row.badge && (
                      <span className={`row-chip row-chip--${row.badgeTone || 'green'}`}>{row.badge}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="phone-footer">{screen.footerNote}</div>
            </div>
          </div>
          <p className="preview-caption">{screen.caption}</p>
        </article>
      ))}
    </div>
  </section>
);
