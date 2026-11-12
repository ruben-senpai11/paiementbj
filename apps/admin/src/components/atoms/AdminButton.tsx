import React from 'react';

type ButtonTone = 'royal' | 'yellow' | 'secondary';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  size?: 'md' | 'sm';
  fullWidth?: boolean;
}

export function AdminButton({
  tone = 'royal',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: AdminButtonProps) {
  const classes = [
    'pbj-admin-btn',
    `pbj-admin-btn--${tone}`,
    size === 'sm' ? 'pbj-admin-btn--sm' : '',
    fullWidth ? 'pbj-admin-btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
