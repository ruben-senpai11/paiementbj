import React from 'react';
import { StepCard } from '../molecules/StepCard';

const STEPS = [
  {
    title: 'Choisissez le service',
    description: 'Sélectionnez l’administration ou le fournisseur à régler depuis l’accueil.',
  },
  {
    title: 'Indiquez la référence',
    description: 'Saisissez votre numéro de dossier, de police d’eau ou de compteur prépayé.',
  },
  {
    title: 'Consultez le montant',
    description: 'Vérifiez le total exact et les frais éventuels avant de passer à la validation.',
  },
  {
    title: 'Validez le règlement',
    description: 'Confirmez sur votre téléphone via Mobile Money ou par carte bancaire.',
  },
  {
    title: 'Conservez le reçu',
    description: 'Retrouvez et téléchargez votre quittance à tout moment dans votre espace.',
  },
];

export const StepsSection: React.FC = () => {
  return (
    <section id="parcours" className="civic-section civic-section--tint" aria-labelledby="steps-title">
      <div className="civic-container">
        <header className="civic-section-head">
          <p className="civic-kicker">Parcours simplifié</p>
          <h2 id="steps-title" className="civic-section-title">
            Un règlement clair en cinq étapes
          </h2>
        </header>

        <ol className="civic-steps">
          {STEPS.map((step) => (
            <StepCard key={step.title} title={step.title} description={step.description} />
          ))}
        </ol>
      </div>
    </section>
  );
};
