import React from 'react';
import { AdminUserInfo } from '@paiementbj/types';
import { AdminButton } from '../atoms/AdminButton';
import { AdminTab } from '../../types';

interface AdminHeaderProps {
  activeTab: AdminTab;
  adminUser: AdminUserInfo;
  loading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

const TAB_TITLES: Record<AdminTab, string> = {
  overview: 'Tableau de bord',
  transactions: 'Supervision des transactions',
  catalog: 'Catalogue des services',
  support: 'Réclamations usagers',
  audit: 'Journal d’audit',
};

export function AdminHeader({
  activeTab,
  adminUser,
  loading,
  onRefresh,
  onLogout,
}: AdminHeaderProps) {
  return (
    <header className="pbj-admin-header">
      <h2 className="pbj-admin-header__title">{TAB_TITLES[activeTab]}</h2>

      <div className="pbj-admin-header__actions">
        <span className="pbj-admin-operator-tag">
          {adminUser.name} ({adminUser.role})
        </span>
        <AdminButton type="button" tone="secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Actualisation...' : 'Actualiser'}
        </AdminButton>
        <AdminButton type="button" tone="secondary" onClick={onLogout}>
          Déconnexion
        </AdminButton>
      </div>
    </header>
  );
}
