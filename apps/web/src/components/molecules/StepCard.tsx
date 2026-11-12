import React from 'react';

export interface StepCardProps {
  title: string;
  description: string;
}

export const StepCard: React.FC<StepCardProps> = ({ title, description }) => (
  <li className="civic-step-card">
    <h3 className="civic-step-title">{title}</h3>
    <p className="civic-step-desc">{description}</p>
  </li>
);
