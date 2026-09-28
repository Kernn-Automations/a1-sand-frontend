import React from 'react';
import styles from './GlobalLoader.module.css';
import { Package } from 'lucide-react';

export default function GlobalLoader({
  message = "Loading Operations...",
  subtext = "Anjali Constructions & Materials",
  fullscreen = false,
}) {
  return (
    <div className={`${styles.loaderContainer} ${fullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.spinnerWrapper}>
        <div className={styles.outerRing} />
        <div className={styles.innerRing} />
        <div className={styles.centerIcon}>
          <Package size={14} color="#ffffff" strokeWidth={2.5} />
        </div>
      </div>

      <div className={styles.brandTitle}>{subtext}</div>
      <div className={styles.brandSub}>{message}</div>

      <div className={styles.progressTrack}>
        <div className={styles.progressBar} />
      </div>
    </div>
  );
}
