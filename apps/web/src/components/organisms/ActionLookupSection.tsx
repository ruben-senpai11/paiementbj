import React, { useState } from 'react';
import { DISTRIBUTION_CONFIG } from '../../config';
import { StoreDownloadGroup } from '../molecules/StoreDownloadGroup';

interface VerifiedReceiptSummary {
  receiptNumber: string;
  beneficiaryName: string;
  serviceTitle: string;
  serviceReference: string;
  totalAmount: number;
  currency: string;
  providerName: string;
  issuedAt: string;
  isVerified: boolean;
}

export interface ActionLookupSectionProps {
  onPendingStore: (target: 'playstore' | 'appstore') => void;
}

export const ActionLookupSection: React.FC<ActionLookupSectionProps> = ({ onPendingStore }) => {
  const [reference, setReference] = useState('PBJ-2026-0001');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<VerifiedReceiptSummary | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = reference.trim();
    if (cleaned.length < 4) {
      setErrorMsg('Veuillez saisir une référence valide (ex : PBJ-2026-0001).');
      setReceipt(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `${DISTRIBUTION_CONFIG.apiBaseUrl}/payments/receipts/verify?reference=${encodeURIComponent(cleaned)}`
      );
      if (!res.ok) {
        throw new Error('HTTP_ERROR');
      }
      const data = await res.json();
      if (data?.found && data?.receipt) {
        setReceipt(data.receipt);
      } else {
        setReceipt(null);
        setErrorMsg('Aucune quittance enregistrée pour cette référence.');
      }
    } catch {
      setReceipt(null);
      setErrorMsg('Service de vérification momentanément indisponible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="verifier" className="civic-section" aria-labelledby="download-title">
      <div className="civic-container civic-split">
        <div id="telecharger" className="civic-split-card">
          <p className="civic-kicker">Accès multi-plateforme</p>
          <h2 id="download-title" className="civic-split-title">
            Disponible sur mobile et navigateur
          </h2>
          <p className="civic-split-desc">
            Installez l’application sur votre téléphone Android ou iPhone, ou effectuez vos
            paiements dès maintenant depuis la version web.
          </p>

          <StoreDownloadGroup
            tone="light"
            playStoreUrl={DISTRIBUTION_CONFIG.playStoreUrl}
            appStoreUrl={DISTRIBUTION_CONFIG.appStoreUrl}
            webAppUrl={DISTRIBUTION_CONFIG.webAppUrl}
            onPendingStore={onPendingStore}
          />
        </div>

        <div className="civic-split-card civic-split-card--tint">
          <p className="civic-kicker">Contrôle instantané</p>
          <h2 className="civic-split-title">Vérifier une quittance</h2>
          <p className="civic-split-desc">
            Entrez le numéro de reçu ou la référence d’opération pour confirmer son authenticité.
          </p>

          <form onSubmit={handleLookup} className="civic-lookup-form">
            <label htmlFor="receipt-ref-input" className="sr-only">
              Référence de reçu ou de transaction
            </label>
            <input
              id="receipt-ref-input"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex : PBJ-2026-0001"
              className="civic-input"
            />
            <button type="submit" className="civic-btn-royal" disabled={loading}>
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
          </form>

          {errorMsg ? (
            <p className="civic-lookup-error" role="alert">
              {errorMsg}
            </p>
          ) : null}

          {receipt ? (
            <div className="civic-lookup-result" aria-live="polite">
              <div className="civic-lookup-head">
                <strong>{receipt.receiptNumber}</strong>
                <span>Confirmé ✓</span>
              </div>
              <p className="civic-lookup-service">{receipt.serviceTitle}</p>
              <dl className="civic-lookup-meta">
                <div>
                  <dt>Bénéficiaire</dt>
                  <dd>{receipt.beneficiaryName}</dd>
                </div>
                <div>
                  <dt>Montant réglé</dt>
                  <dd>
                    {receipt.totalAmount.toLocaleString('fr-FR')} {receipt.currency}
                  </dd>
                </div>
                <div>
                  <dt>Moyen de paiement</dt>
                  <dd>{receipt.providerName}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
