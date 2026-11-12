import React, { useEffect } from 'react';
import { DISTRIBUTION_CONFIG } from '../../config';

export type PendingStoreTarget = 'playstore' | 'appstore' | null;

export interface ReleaseModalProps {
  target: PendingStoreTarget;
  onClose: () => void;
}

export const ReleaseModal: React.FC<ReleaseModalProps> = ({ target, onClose }) => {
  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, onClose]);

  if (!target) return null;

  const isPlay = target === 'playstore';
  const title = isPlay ? 'Application Android · Google Play' : 'Application iOS · App Store';
  const description = isPlay
    ? 'Le lien public Google Play est en cours de déploiement pour cet environnement. Utilisez dès maintenant l’application web complète depuis votre téléphone ou ordinateur.'
    : 'Le lien public App Store est en cours de déploiement pour cet environnement. Utilisez dès maintenant l’application web complète depuis votre navigateur Safari.';

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
            {title}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <p className="modal-body">{description}</p>

        <div className="modal-actions">
          <a href={DISTRIBUTION_CONFIG.webAppUrl} className="civic-cta-yellow">
            Ouvrir l’application web
          </a>
          <button type="button" className="modal-btn-dismiss" onClick={onClose} autoFocus>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
