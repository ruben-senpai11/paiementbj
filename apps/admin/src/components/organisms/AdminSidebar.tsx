import React from 'react';
import { AdminFlagBar } from '../atoms/AdminFlagBar';
import { AdminTab } from '../../types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
}

const NAV_ITEMS: Array<{ id: AdminTab; label: string }> = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'catalog', label: 'Catalogue' },
  { id: 'support', label: 'Réclamations' },
  { id: 'audit', label: 'Journal d’audit' },
];

export function AdminSidebar({ activeTab, onSelectTab }: AdminSidebarProps) {
  return (
    <aside className="pbj-admin-sidebar">
      <div>
        <div className="pbj-admin-brand">
          <AdminFlagBar />
          <h1 className="pbj-admin-brand__title">Paiement BJ</h1>
          <p className="pbj-admin-brand__sub">Administration</p>
        </div>

        <nav aria-label="Navigation principale back-office" className="pbj-admin-nav">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`pbj-admin-nav__item${active ? ' pbj-admin-nav__item--active' : ''}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pbj-admin-sidebar__footer">
        <span>République du Bénin</span>
        <span>Portail de gouvernance</span>
      </div>
    </aside>
  );
}
