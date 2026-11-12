import React, { useState } from 'react';
import { DISTRIBUTION_CONFIG } from '../../config';
import { SiteHeader } from '../organisms/SiteHeader';
import { HeroSection } from '../organisms/HeroSection';
import { TeaserStrip } from '../organisms/TeaserStrip';
import { SpotlightSection } from '../organisms/SpotlightSection';
import { StepsSection } from '../organisms/StepsSection';
import { ActionLookupSection } from '../organisms/ActionLookupSection';
import { SiteFooter } from '../organisms/SiteFooter';
import { PendingStoreTarget, ReleaseModal } from '../organisms/ReleaseModal';

export const DistributionTemplate: React.FC = () => {
  const [pendingTarget, setPendingTarget] = useState<PendingStoreTarget>(null);

  return (
    <div className="civic-shell">
      <a href="#main-content" className="sr-only">
        Aller au contenu principal
      </a>

      <SiteHeader webAppUrl={DISTRIBUTION_CONFIG.webAppUrl} />

      <main id="main-content">
        <HeroSection onPendingStore={setPendingTarget} />
        <TeaserStrip />
        <SpotlightSection />
        <StepsSection />
        <ActionLookupSection onPendingStore={setPendingTarget} />
      </main>

      <SiteFooter />

      <ReleaseModal target={pendingTarget} onClose={() => setPendingTarget(null)} />
    </div>
  );
};
