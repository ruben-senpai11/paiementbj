import React from 'react';

export const SpotlightSection: React.FC = () => {
  return (
    <section id="evolution" className="civic-section" aria-labelledby="spotlight-title">
      <div className="civic-container">
        <div className="civic-spotlight">
          <div className="civic-spotlight-copy">
            <p className="civic-kicker civic-kicker--yellow">L’innovation Paiement BJ</p>
            <h2 id="spotlight-title" className="civic-spotlight-title">
              Pourquoi repenser l’expérience des guichets de paiement public
            </h2>
            <p className="civic-spotlight-desc">
              Sur les portails classiques comme BJPay, l’usager doit d’abord se rendre sur le site
              de chaque administration, ressaisir ses informations et payer opération par opération.
              Paiement BJ centralise toutes vos démarches, détaille chaque frais avant confirmation
              et regroupe l’ensemble de vos reçus dans un seul espace.
            </p>
          </div>

          <div className="civic-spotlight-points">
            <div className="civic-point">
              <h3>Un seul accès pour tous les services</h3>
              <p>
                Trésor Public, ANIP, SBEE, SONEB et opérateurs quotidiens restent accessibles depuis
                le même écran.
              </p>
            </div>
            <div className="civic-point">
              <h3>Mobile Money et cartes réunis</h3>
              <p>
                Réglez au choix par MTN MoMo, Moov Money, Celtiis Cash ou carte Visa / Mastercard.
              </p>
            </div>
            <div className="civic-point">
              <h3>Quittances immédiatement disponibles</h3>
              <p>
                Chaque opération génère un justificatif vérifiable et conservé dans votre
                historique personnel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
