import React from 'react';

export const TeaserStrip: React.FC = () => {
  return (
    <div className="civic-teaser-wrap">
      <div className="civic-container">
        <div className="civic-teaser-card">
          <div>
            <p className="civic-teaser-kicker">Une évolution du télépaiement public</p>
            <h2 className="civic-teaser-title">
              D’une mosaïque de portails isolés vers une application citoyenne unifiée
            </h2>
          </div>
          <a href="#evolution" className="civic-teaser-link">
            Voir les avantages →
          </a>
        </div>
      </div>
    </div>
  );
};
