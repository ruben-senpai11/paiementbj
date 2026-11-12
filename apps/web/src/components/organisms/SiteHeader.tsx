import React from 'react';
import { PaiementBjEmblem } from '../atoms/StoreIcons';

export interface SiteHeaderProps {
  webAppUrl: string;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({ webAppUrl }) => {
  return (
    <header className="civic-header">
      <div className="civic-container civic-header-inner">
        <a href="#accueil" className="civic-brand" aria-label="Paiement BJ — Accueil">
          <PaiementBjEmblem size={42} />
          <div className="civic-brand-text">
            <strong>Paiement BJ</strong>
            <span>Services publics &amp; factures</span>
          </div>
        </a>

        <nav className="civic-nav" aria-label="Navigation principale">
          <a href="#evolution" className="civic-nav-link">
            L’évolution
          </a>
          <a href="#parcours" className="civic-nav-link">
            Comment ça marche
          </a>
          <a href="#verifier" className="civic-nav-link">
            Vérifier un reçu
          </a>
          <a href={webAppUrl} className="civic-nav-cta">
            Ouvrir l’app
          </a>
        </nav>
      </div>
    </header>
  );
};
