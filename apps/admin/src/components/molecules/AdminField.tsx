import React from 'react';

interface AdminFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminField({ id, label, children, className = '' }: AdminFieldProps) {
  return (
    <div className={`pbj-admin-field ${className}`.trim()}>
      <label htmlFor={id} className="pbj-admin-field__label">
        {label}
      </label>
      {children}
    </div>
  );
}
