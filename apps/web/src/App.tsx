import React, { useState } from 'react';
import { DISTRIBUTION_CONFIG } from './config';
import {
  AppleStoreIcon,
  GooglePlayPrismIcon,
  NoWalletShieldIcon,
  PaiementBjSquircleIcon,
  ReceiptVerifiedIcon,
  UnifiedLayersIcon,
  VerifiedBadgeIcon,
  WebGlobeIcon,
} from './components/StoreIcons';
import { StorePreviewRail } from './components/StorePreviewRail';
import { PendingStoreTarget, ReleaseModal } from './components/ReleaseModal';

import sbeeLogo from '@brands/sbee/sbee-logo.webp';
import sonebLogo from '@brands/soneb/soneb-logo.png';
import tresorLogo from '@brands/tresor/tresor-logo.jpg';
import anipLogo from '@brands/anip/anip-logo.png';
import mtnMomoLogo from '@brands/mtn-momo/mtn-momo-logo.png';
import moovMoneyLogo from '@brands/moov-money/moov-money-logo.png';
import celtiisLogo from '@brands/celtiis/celtiis-logo.png';
import visaLogo from '@brands/visa/visa-logo.svg';

const ECOSYSTEM_PARTNERS = [
  { key: 'sbee', name: 'SBEE', logo: sbeeLogo },
  { key: 'soneb', name: 'SONEB', logo: sonebLogo },
  { key: 'tresor', name: 'Trésor Public', logo: tresorLogo },
  { key: 'anip', name: 'ANIP', logo: anipLogo },
  { key: 'mtn', name: 'MTN MoMo', logo: mtnMomoLogo },
  { key: 'moov', name: 'Moov Money', logo: moovMoneyLogo },
  { key: 'celtiis', name: 'Celtiis', logo: celtiisLogo },
  { key: 'visa', name: 'Cartes Visa', logo: visaLogo },
];

export default function App() {
  const [modalTarget, setModalTarget] = useState<PendingStoreTarget>(null);

  const playUrl = DISTRIBUTION_CONFIG.playStoreUrl;
  const appStoreUrl = DISTRIBUTION_CONFIG.appStoreUrl;
  const webUrl = DISTRIBUTION_CONFIG.webAppUrl;

  return (
    <>
      <a href="#main-content" className="skip-link">
        Aller directement au contenu principal
      </a>

      {/* En-tête minimaliste style Store */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <PaiementBjSquircleIcon size={32} />
            <span>{DISTRIBUTION_CONFIG.appName}</span>
          </div>

          <div className="topbar-meta">
            <span className="store-combo-pill">
              <GooglePlayPrismIcon size={14} />
              <span>Play Store</span>
              <span aria-hidden="true">·</span>
              <AppleStoreIcon size={14} />
              <span>App Store</span>
            </span>

            {webUrl ? (
              <a
                href={webUrl}
                target={webUrl.startsWith('/') ? undefined : '_blank'}
                rel={webUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
                className="topbar-web-link"
              >
                <WebGlobeIcon />
                <span>Ouvrir Web</span>
              </a>
            ) : (
              <button
                type="button"
                className="topbar-web-link"
                onClick={() => setModalTarget('webapp')}
              >
                <WebGlobeIcon />
                <span>Version Web</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="main-container">
        {/* Hero inspiré Google Play Store + Apple App Store */}
        <section className="hero-card" aria-labelledby="app-title">
          <div className="hero-identity">
            <div className="hero-icon-wrap">
              <PaiementBjSquircleIcon size={92} />
            </div>

            <div className="hero-text">
              <div className="hero-title-row">
                <h1 id="app-title" className="hero-title">
                  {DISTRIBUTION_CONFIG.appName}
                </h1>
                <span className="verified-tag">
                  <VerifiedBadgeIcon />
                  <span>Application officielle</span>
                </span>
              </div>

              <p className="hero-publisher">{DISTRIBUTION_CONFIG.publisher}</p>
              <p className="hero-tagline">
                <strong>{DISTRIBUTION_CONFIG.tagline}</strong> Réglez électricité, eau, impôts,
                timbres fiscaux et services du Bénin depuis une interface unique, sans portefeuille
                intermédiaire.
              </p>
            </div>
          </div>

          {/* Barre de métadonnées vérifiables (zéro faux avis ou compteur simulé) */}
          <div className="store-metrics-strip" role="list" aria-label="Caractéristiques clés">
            <div className="metric-cell" role="listitem">
              <span className="metric-value">Android · iOS · Web</span>
              <span className="metric-label">Plateformes</span>
            </div>
            <div className="metric-cell" role="listitem">
              <span className="metric-value">Zéro portefeuille</span>
              <span className="metric-label">Fonds non retenus</span>
            </div>
            <div className="metric-cell" role="listitem">
              <span className="metric-value">WCAG 2.2 AAA</span>
              <span className="metric-label">Lisibilité universelle</span>
            </div>
          </div>

          {/* Appels à l'action clairs : Google Play + App Store + Web */}
          <div className="cta-group" aria-label="Télécharger Paiement BJ">
            {playUrl ? (
              <a
                href={playUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="store-btn store-btn--play"
              >
                <GooglePlayPrismIcon size={26} />
                <span className="store-btn-copy">
                  <span className="store-btn-kicker">Disponible sur</span>
                  <span className="store-btn-name">Google Play</span>
                </span>
                <span className="store-btn-state store-btn-state--live">Installer</span>
              </a>
            ) : (
              <button
                type="button"
                className="store-btn store-btn--play"
                onClick={() => setModalTarget('playstore')}
              >
                <GooglePlayPrismIcon size={26} />
                <span className="store-btn-copy">
                  <span className="store-btn-kicker">Android · Google Play</span>
                  <span className="store-btn-name">Google Play</span>
                </span>
                <span className="store-btn-state">Bientôt</span>
              </button>
            )}

            {appStoreUrl ? (
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="store-btn store-btn--apple"
              >
                <AppleStoreIcon size={25} />
                <span className="store-btn-copy">
                  <span className="store-btn-kicker">Télécharger dans</span>
                  <span className="store-btn-name">l’App Store</span>
                </span>
                <span className="store-btn-state store-btn-state--live">Installer</span>
              </a>
            ) : (
              <button
                type="button"
                className="store-btn store-btn--apple"
                onClick={() => setModalTarget('appstore')}
              >
                <AppleStoreIcon size={25} />
                <span className="store-btn-copy">
                  <span className="store-btn-kicker">iOS · App Store</span>
                  <span className="store-btn-name">App Store</span>
                </span>
                <span className="store-btn-state">Bientôt</span>
              </button>
            )}

            {webUrl ? (
              <a
                href={webUrl}
                target={webUrl.startsWith('/') ? undefined : '_blank'}
                rel={webUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
                className="cta-web-secondary"
              >
                <WebGlobeIcon />
                <span>Accès navigateur Web</span>
              </a>
            ) : (
              <button
                type="button"
                className="cta-web-secondary"
                onClick={() => setModalTarget('webapp')}
              >
                <WebGlobeIcon />
                <span>Accès navigateur Web</span>
              </button>
            )}
          </div>
        </section>

        {/* Avantages clés mis en avant dès le premier écran */}
        <section className="store-section" aria-labelledby="benefits-heading">
          <div className="section-head">
            <h2 id="benefits-heading" className="section-title">
              Pourquoi choisir Paiement BJ ?
            </h2>
            <span className="section-sub">Simplicité · Souveraineté · Preuve</span>
          </div>

          <div className="benefits-grid">
            <article className="benefit-card">
              <span className="benefit-icon">
                <UnifiedLayersIcon />
              </span>
              <h3 className="benefit-title">Un seul point d’accès</h3>
              <p className="benefit-desc">
                Électricité, eau, impôts, timbres fiscaux, identité et abonnements réunis dans un
                parcours clair et identique.
              </p>
            </article>

            <article className="benefit-card">
              <span className="benefit-icon">
                <NoWalletShieldIcon />
              </span>
              <h3 className="benefit-title">Zéro portefeuille interne</h3>
              <p className="benefit-desc">
                Vos fonds restent sur votre compte Mobile Money ou bancaire. Paiement BJ orchestre
                l’opération sans jamais détenir votre argent.
              </p>
            </article>

            <article className="benefit-card">
              <span className="benefit-icon">
                <ReceiptVerifiedIcon />
              </span>
              <h3 className="benefit-title">Justificatifs centralisés</h3>
              <p className="benefit-desc">
                Chaque opération génère un suivi fiable, un reçu vérifiable par empreinte SHA-256 et
                une ergonomie accessible à tous.
              </p>
            </article>
          </div>
        </section>

        {/* Galerie d'aperçu épurée */}
        <StorePreviewRail />

        {/* Écosystème et fiche technique Store */}
        <section className="store-section store-section--last" aria-labelledby="info-heading">
          <div className="section-head">
            <h2 id="info-heading" className="section-title">
              Écosystème &amp; fiche technique
            </h2>
            <span className="section-sub">Activation selon conventions partenaires</span>
          </div>

          <div className="partners-row" aria-label="Services et opérateurs pris en charge dans l’architecture">
            {ECOSYSTEM_PARTNERS.map((partner) => (
              <div key={partner.key} className="partner-tile">
                <img
                  src={partner.logo}
                  alt={`Logo ${partner.name}`}
                  className="partner-logo"
                  width={24}
                  height={24}
                />
                <span className="partner-name">{partner.name}</span>
              </div>
            ))}
          </div>

          <dl className="info-grid" style={{ marginTop: 18 }}>
            <div className="info-cell">
              <dt className="info-dt">Identifiant d’application</dt>
              <dd className="info-dd">
                <code>{DISTRIBUTION_CONFIG.packageId}</code>
              </dd>
            </div>
            <div className="info-cell">
              <dt className="info-dt">Version cible</dt>
              <dd className="info-dd">{DISTRIBUTION_CONFIG.version}</dd>
            </div>
            <div className="info-cell">
              <dt className="info-dt">Cadre réglementaire</dt>
              <dd className="info-dd">Instruction BCEAO n°001-01-2024</dd>
            </div>
            <div className="info-cell">
              <dt className="info-dt">Protection des données</dt>
              <dd className="info-dd">Conformité APDP Bénin</dd>
            </div>
          </dl>
        </section>

        <footer className="site-footer">
          <span>
            {DISTRIBUTION_CONFIG.appName} — Distribution multiplateforme (Android, iOS, Web)
          </span>
          <span>Aucun fonds conservé par l’application</span>
        </footer>
      </main>

      <ReleaseModal target={modalTarget} onClose={() => setModalTarget(null)} />
    </>
  );
}
