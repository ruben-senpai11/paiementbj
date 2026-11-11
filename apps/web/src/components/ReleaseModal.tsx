import React, { useEffect } from 'react';
import { DISTRIBUTION_CONFIG } from '../config';

export type PendingStoreTarget = 'playstore' | 'appstore' | 'webapp' | null;

interface ReleaseModalProps {
  target: PendingStoreTarget;
  onClose: () => void;
}

export const ReleaseModal: React.FC<ReleaseModalProps> = ({ target, onClose }) => {
  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, onClose]);

  if (!target) return null;

  const titles: Record<Exclude<PendingStoreTarget, null>, string> = {
    playstore: 'Google Play — Publication en cours de préparation',
    appstore: 'App Store — Publication en cours de préparation',
    webapp: 'Application Web — URL de déploiement non configurée',
  };

  const details: Record<Exclude<PendingStoreTarget, null>, string> = {
    playstore:
      'Le binaire Android signé (.aab / .apk) pour l’identifiant bj.paiement.app n’est pas encore publié sur Google Play Console dans cet environnement. Dès publication, renseignez VITE_PLAY_STORE_URL pour activer la redirection directe.',
    appstore:
      'Le binaire iOS signé (.ipa) pour l’identifiant bj.paiement.app n’est pas encore publié sur App Store Connect dans cet environnement (build EAS / Xcode requis). Dès publication, renseignez VITE_APP_STORE_URL pour activer le lien direct.',
    webapp:
      'Le lien public de l’application citoyenne Web n’a pas encore été renseigné dans VITE_WEB_APP_URL pour cette distribution.',
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-modal-title"
      >
        <div className="modal-header">
          <h2 id="release-modal-title" className="modal-title">
            {titles[target]}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer la fenêtre d’information"
          >
            ✕
          </button>
        </div>

        <p className="modal-body">{details[target]}</p>

        <dl className="modal-specs">
          <div className="modal-spec-row">
            <dt>Identifiant paquet</dt>
            <dd>
              <code>{DISTRIBUTION_CONFIG.packageId}</code>
            </dd>
          </div>
          <div className="modal-spec-row">
            <dt>Version cible</dt>
            <dd>{DISTRIBUTION_CONFIG.version}</dd>
          </div>
        </dl>

        <div className="modal-actions">
          {DISTRIBUTION_CONFIG.webAppUrl && target !== 'webapp' && (
            <a
              href={DISTRIBUTION_CONFIG.webAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-web-primary"
            >
              Ouvrir la version Web en attendant
            </a>
          )}
          <button type="button" className="btn-modal-dismiss" onClick={onClose} autoFocus>
            Compris
          </button>
        </div>
      </div>
    </div>
  );
};
