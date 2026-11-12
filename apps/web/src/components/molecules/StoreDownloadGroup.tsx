import React from 'react';
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
            target="_blank"
            rel="noopener noreferrer"
            className="store-btn-clean"
          >
            <GooglePlayPrismIcon size={18} />
            <span>Google Play</span>
          </a>
        ) : (
          <button
            type="button"
            className="store-btn-clean"
            onClick={() => onPendingStore('playstore')}
          >
            <GooglePlayPrismIcon size={18} />
            <span>Google Play</span>
          </button>
        )}

        {appStoreUrl ? (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="store-btn-clean"
          >
            <AppleStoreIcon size={18} />
            <span>App Store</span>
          </a>
        ) : (
          <button
            type="button"
            className="store-btn-clean"
            onClick={() => onPendingStore('appstore')}
          >
            <AppleStoreIcon size={18} />
            <span>App Store</span>
          </button>
        )}
      </div>
    </div>
  );
};
