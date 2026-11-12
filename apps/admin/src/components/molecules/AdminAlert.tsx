import React from 'react';

interface AdminAlertProps {
  tone: 'error' | 'success';
  message: string;
}

export function AdminAlert({ tone, message }: AdminAlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`pbj-admin-alert pbj-admin-alert--${tone}`}
    >
      {message}
    </div>
  );
}
