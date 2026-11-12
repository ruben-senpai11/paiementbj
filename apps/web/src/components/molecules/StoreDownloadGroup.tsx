import React from 'react';
import { DISTRIBUTION_CONFIG } from '../../config';
import { GooglePlayPrismIcon, AppleStoreIcon } from '../atoms/StoreIcons';

export interface StoreDownloadGroupProps {
  playStoreUrl: string | null;
  appStoreUrl: string | null;
  webAppUrl: string;
  onPendingStore: (target: 'playstore' | 'appstore') => void;
  tone?: 'hero' | 'light';
}

export const StoreDownloadGroup: React.FC<StoreDownloadGroupProps> = ({
  playStoreUrl,
  appStoreUrl,
  webAppUrl,
  onPendingStore,
  tone = 'light',
}) => {
  return (
    <div className={`store-download-group store-download-group--${tone}`}>
      <a
        href={webAppUrl}
        className="civic-cta-yellow"
      >
        Ouvrir l’application
      </a>

      <div className="store-pills-row">
        {playStoreUrl ? (
          <a
            href={playStoreUrl}
            download
            className="store-btn-clean"
          >
            <GooglePlayPrismIcon size={18} />
            <span>Installer sur Android</span>
          </a>
        ) : (
          <button
            type="button"
            className="store-btn-clean"
            onClick={() => onPendingStore('playstore')}
          >
            <GooglePlayPrismIcon size={18} />
            <span>Installer sur Android</span>
          </button>
        )}

        {appStoreUrl ? (
          <a
            href={appStoreUrl}
            download
            className="store-btn-clean"
          >
            <AppleStoreIcon size={18} />
            <span>Installer sur iPhone</span>
          </a>
        ) : (
          <a
            href={DISTRIBUTION_CONFIG.iosProfileUrl}
            download="PaiementBJ-iPhone.mobileconfig"
            className="store-btn-clean"
            onClick={() => onPendingStore('appstore')}
          >
            <AppleStoreIcon size={18} />
            <span>Installer sur iPhone</span>
          </a>
        )}
      </div>
    </div>
  );
};
