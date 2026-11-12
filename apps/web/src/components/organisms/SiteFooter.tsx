import React from 'react';
import { DISTRIBUTION_CONFIG } from '../../config';
import { FlagStripe } from '../atoms/FlagStripe';

export const SiteFooter: React.FC = () => {
  return (
    <footer className="civic-footer">
      <div className="civic-container civic-footer-grid">
        <div>
          <p className="civic-footer-title">Paiement BJ</p>
          <p className="civic-footer-text">
            Plateforme de télépaiement des services publics, factures et démarches en République du
            Bénin.
          </p>
        </div>

        <div>
          <p className="civic-footer-heading">Parcours</p>
          <ul className="civic-footer-list">
            <li>
              <a href="#evolution">L’évolution</a>
            </li>
            <li>
              <a href="#parcours">Comment payer</a>
            </li>
            <li>
              <a href="#verifier">Vérifier une quittance</a>
            </li>
          </ul>
        </div>

        <div>
          <p className="civic-footer-heading">Plateformes</p>
          <ul className="civic-footer-list">
            <li>
              <a href={DISTRIBUTION_CONFIG.webAppUrl}>Application citoyenne</a>
            </li>
            <li>
              <a href="/admin">Espace administration</a>
            </li>
            <li>
              <a href="/api/docs">Documentation API</a>
            </li>
          </ul>
        </div>
      </div>

      <FlagStripe />
    </footer>
  );
};
