import React from 'react';

interface AdminMetricCardProps {
  label: string;
  value: string | number;
  footnote: string;
  tone?: 'default' | 'success' | 'warning';
}

export function AdminMetricCard({
  label,
  value,
  footnote,
  tone = 'default',
}: AdminMetricCardProps) {
  const valueClass =
    tone === 'success'
      ? 'pbj-admin-metric__value pbj-admin-metric__value--success'
      : tone === 'warning'
        ? 'pbj-admin-metric__value pbj-admin-metric__value--warning'
        : 'pbj-admin-metric__value';

  return (
    <div className="pbj-admin-metric">
      <span className="pbj-admin-metric__label">{label}</span>
      <strong className={valueClass}>{value}</strong>
      <span className="pbj-admin-metric__foot">{footnote}</span>
    </div>
  );
}
