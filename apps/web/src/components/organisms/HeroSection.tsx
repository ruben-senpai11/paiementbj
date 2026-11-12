import React from 'react';
import { DISTRIBUTION_CONFIG } from '../../config';
import { StoreDownloadGroup } from '../molecules/StoreDownloadGroup';

export interface HeroSectionProps {
  onPendingStore: (target: 'playstore' | 'appstore') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onPendingStore }) => {
  return (
    <section id="accueil" className="civic-hero" aria-labelledby="hero-title">
      <div className="civic-container civic-hero-grid">
        <div className="civic-hero-copy">
          <p className="civic-eyebrow">République du Bénin</p>
          <h1 id="hero-title" className="civic-hero-title">
            Réglez vos démarches et factures en{' '}
            <em className="civic-hero-em">un seul geste</em>.
          </h1>
          <p className="civic-hero-lead">
            Paiement BJ réunit les services publics, l’eau, l’électricité et vos abonnements dans
            une seule application. Simple, clair et accessible partout.
          </p>

          <StoreDownloadGroup
            tone="hero"
            playStoreUrl={DISTRIBUTION_CONFIG.playStoreUrl}
            appStoreUrl={DISTRIBUTION_CONFIG.appStoreUrl}
            webAppUrl={DISTRIBUTION_CONFIG.webAppUrl}
            onPendingStore={onPendingStore}
          />
        </div>

        <div className="civic-hero-media-col">
          <div className="civic-portrait-frame" aria-label="Aperçu de l’application Paiement BJ">
            <div className="hero-phone-preview">
              <div className="hero-phone-head">
                <span className="hero-phone-title">Paiement BJ</span>
                <span className="hero-phone-sub">Catalogue national</span>
              </div>

              <div className="hero-phone-list">
                <div className="hero-phone-row">
                  <div>
                    <strong>SBEE · Recharge ISAGO</strong>
                    <span>Électricité prépayée</span>
                  </div>
                  <span className="hero-phone-arrow">→</span>
                </div>
                <div className="hero-phone-row">
                  <div>
                    <strong>Trésor Public · Timbres fiscaux</strong>
                    <span>Démarches administratives</span>
                  </div>
                  <span className="hero-phone-arrow">→</span>
                </div>
                <div className="hero-phone-row">
                  <div>
                    <strong>SONEB · Facture d’eau</strong>
                    <span>Règlement immédiat</span>
                  </div>
                  <span className="hero-phone-arrow">→</span>
                </div>
              </div>

              <div className="hero-phone-confirm">
                <div>
                  <span className="hero-confirm-kicker">Dernier règlement</span>
                  <strong>15 050 FCFA · MTN Mobile Money</strong>
                </div>
                <span className="hero-confirm-check" aria-hidden="true">✓</span>
              </div>
            </div>
          </div>

          <div className="civic-portrait-note">
            <p>Un guichet unique sur mobile et navigateur pour l’ensemble de vos règlements.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
