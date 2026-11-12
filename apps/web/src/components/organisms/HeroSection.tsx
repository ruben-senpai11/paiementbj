import React from 'react';
import { DISTRIBUTION_CONFIG } from '../../config';
import { IPhoneMockup } from '../molecules/IPhoneMockup';
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
          <IPhoneMockup
            src="/images/paiement-bj-mobile.png"
            alt="Application mobile Paiement BJ"
          />
        </div>
      </div>
    </section>
  );
};
