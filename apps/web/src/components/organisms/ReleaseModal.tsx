import React, { useEffect, useState } from 'react';
import { DISTRIBUTION_CONFIG } from '../../config';

export type PendingStoreTarget = 'playstore' | 'appstore' | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ReleaseModalProps {
  target: PendingStoreTarget;
  onClose: () => void;
}

export const ReleaseModal: React.FC<ReleaseModalProps> = ({ target, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, onClose]);

  if (!target) return null;

  const isAndroid = target === 'playstore';
  const title = isAndroid ? 'Tester sur Android' : 'Tester sur iPhone';
  const description = isAndroid
    ? 'Installez Paiement BJ directement sur votre téléphone Android depuis Chrome (« Installer l’application » dans le menu du navigateur) pour l’utiliser comme une application locale.'
    : 'Téléchargez le profil d’installation Paiement BJ pour iPhone, puis validez-le dans Réglages > Profil téléchargé pour ajouter l’application sur votre écran d’accueil.';

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      onClose();
      return;
    }
    window.location.assign(DISTRIBUTION_CONFIG.webAppUrl);
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
          {isAndroid ? (
            <button
              type="button"
              className="civic-cta-yellow"
              onClick={handleAndroidInstall}
            >
              Installer sur Android
            </button>
          ) : (
            <>
              <a
                href={DISTRIBUTION_CONFIG.iosProfileUrl}
                download="PaiementBJ-iPhone.mobileconfig"
                className="civic-cta-yellow"
              >
                Télécharger pour iPhone
              </a>
              <a
                href={DISTRIBUTION_CONFIG.webAppUrl}
                className="modal-btn-dismiss"
              >
                Ouvrir dans Safari
              </a>
            </>
          )}
          <button type="button" className="modal-btn-dismiss" onClick={onClose} autoFocus>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
