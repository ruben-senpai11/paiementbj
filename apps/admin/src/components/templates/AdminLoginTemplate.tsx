import React from 'react';
import { AdminButton } from '../atoms/AdminButton';
import { AdminFlagBar } from '../atoms/AdminFlagBar';
import { AdminAlert } from '../molecules/AdminAlert';
import { AdminField } from '../molecules/AdminField';

interface AdminLoginTemplateProps {
  email: string;
  password: string;
  loggingIn: boolean;
  authError: string | null;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AdminLoginTemplate({
  email,
  password,
  loggingIn,
  authError,
  onChangeEmail,
  onChangePassword,
  onSubmit,
}: AdminLoginTemplateProps) {
  return (
    <div className="pbj-admin-login">
      <div className="pbj-admin-login__hero">
        <div style={{ maxWidth: 160, margin: '0 auto' }}>
          <AdminFlagBar />
        </div>
        <h1 id="admin-login-title" className="pbj-admin-login__hero-title">
          Paiement BJ — Administration
        </h1>
        <div className="pbj-admin-login__hero-accent" aria-hidden="true" />
      </div>

      <div className="pbj-admin-login__card-wrap">
        <main className="pbj-admin-login__card" aria-labelledby="admin-login-title">
          <p className="pbj-admin-login__subtitle">
            Accès réservé aux opérateurs habilités.
          </p>

          {authError && <AdminAlert tone="error" message={authError} />}

          <form onSubmit={onSubmit} className="pbj-admin-login__form">
            <AdminField id="admin-email" label="Adresse e-mail">
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => onChangeEmail(e.target.value)}
                placeholder="admin@paiementbj.gouv.bj"
                className="pbj-admin-input"
              />
            </AdminField>

            <AdminField id="admin-password" label="Mot de passe">
              <input
                id="admin-password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => onChangePassword(e.target.value)}
                placeholder="••••••••••••"
                className="pbj-admin-input"
              />
            </AdminField>

            <AdminButton type="submit" tone="yellow" fullWidth disabled={loggingIn}>
              {loggingIn ? 'Vérification...' : 'Ouvrir une session'}
            </AdminButton>
          </form>
        </main>
      </div>
    </div>
  );
}
