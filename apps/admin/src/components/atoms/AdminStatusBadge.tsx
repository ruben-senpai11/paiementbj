import React from 'react';

interface AdminStatusBadgeProps {
  status: string;
  label?: string;
}

function getBadgeTone(status: string): 'success' | 'warning' | 'danger' | 'royal' {
  switch (status) {
    case 'OPERATIONAL':
    case 'LIVE':
    case 'SUCCEEDED':
    case 'RESOLVED':
      return 'success';
    case 'SANDBOX_CONNECTED':
      return 'royal';
    case 'PENDING':
    case 'PROCESSING':
    case 'INVESTIGATING':
    case 'PENDING_AGREEMENT':
    case 'TECHNICAL_IN_PROGRESS':
      return 'warning';
    case 'UNAVAILABLE':
    case 'FAILED':
    case 'CLOSED':
    default:
      return 'danger';
  }
}

function getDefaultLabel(status: string): string {
  switch (status) {
    case 'OPERATIONAL':
      return 'Disponible';
    case 'LIVE':
      return 'Actif';
    case 'SANDBOX_CONNECTED':
      return 'Test connecté';
    case 'PENDING_AGREEMENT':
      return 'En attente';
    case 'TECHNICAL_IN_PROGRESS':
      return 'En configuration';
    case 'UNAVAILABLE':
      return 'Indisponible';
    case 'SUCCEEDED':
      return 'Confirmé';
    case 'PENDING':
    case 'PROCESSING':
      return 'En cours';
    case 'FAILED':
      return 'Échoué';
    default:
      return status;
  }
}

export function AdminStatusBadge({ status, label }: AdminStatusBadgeProps) {
  const tone = getBadgeTone(status);
  return (
    <span className={`pbj-admin-badge pbj-admin-badge--${tone}`}>
      {label || getDefaultLabel(status)}
    </span>
  );
}
