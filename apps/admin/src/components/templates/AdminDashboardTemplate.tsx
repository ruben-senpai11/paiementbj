import React from 'react';
import { AdminUserInfo } from '@paiementbj/types';
import { AdminAlert } from '../molecules/AdminAlert';
import { AdminHeader } from '../organisms/AdminHeader';
import { AdminSidebar } from '../organisms/AdminSidebar';
import { AdminTab } from '../../types';

interface AdminDashboardTemplateProps {
  activeTab: AdminTab;
  adminUser: AdminUserInfo;
  loadingData: boolean;
  feedbackMessage: string | null;
  apiError: string | null;
  onSelectTab: (tab: AdminTab) => void;
  onRefresh: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AdminDashboardTemplate({
  activeTab,
  adminUser,
  loadingData,
  feedbackMessage,
  apiError,
  onSelectTab,
  onRefresh,
  onLogout,
  children,
}: AdminDashboardTemplateProps) {
  return (
    <div className="pbj-admin-shell">
      <AdminSidebar activeTab={activeTab} onSelectTab={onSelectTab} />

      <main className="pbj-admin-main">
        <AdminHeader
          activeTab={activeTab}
          adminUser={adminUser}
          loading={loadingData}
          onRefresh={onRefresh}
          onLogout={onLogout}
        />

        {feedbackMessage && <AdminAlert tone="success" message={feedbackMessage} />}
        {apiError && <AdminAlert tone="error" message={apiError} />}

        {children}
      </main>
    </div>
  );
}
