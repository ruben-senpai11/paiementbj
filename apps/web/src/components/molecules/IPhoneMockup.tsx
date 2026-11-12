import React from 'react';
import styles from './IPhoneMockup.module.css';

export interface IPhoneMockupProps {
  src: string;
  alt?: string;
  className?: string;
}

export const IPhoneMockup: React.FC<IPhoneMockupProps> = ({
  src,
  alt = 'Paiement BJ sur iPhone',
  className = '',
}) => {
  return (
    <div className={`${styles.stage} ${className}`.trim()}>
      <div className={styles.phone}>
        {/* Châssis métallique titane naturel */}
        <div className={styles.frame}>
          {/* Écran */}
          <div className={styles.screen}>
            <img
              src={src}
              alt={alt}
              className={styles.image}
              loading="eager"
              decoding="async"
            />

            {/* Dynamic Island */}
            <div className={styles.dynamicIsland} aria-hidden="true">
              <span />
            </div>

            {/* Reflet subtil sur le verre */}
            <div className={styles.screenReflection} aria-hidden="true" />
          </div>
        </div>

        {/* Boutons physiques */}
        <div className={styles.actionButton} aria-hidden="true" />
        <div className={styles.volumeUp} aria-hidden="true" />
        <div className={styles.volumeDown} aria-hidden="true" />
        <div className={styles.powerButton} aria-hidden="true" />
      </div>
    </div>
  );
};

export default IPhoneMockup;
