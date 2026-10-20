import React from 'react';
import styles from './HeroPanel.module.css';

export const HeroPanel: React.FC = () => (
  <section className={styles.hero} aria-label="Workspace header">
    <div>
      <p className={`eyebrow ${styles.eyebrow}`}>Inspection workspace <span className={styles.shiftChip}>SHIFT B</span></p>
      <h1 className={styles.title}>Surveillance under a bogie</h1>
      <p className={styles.copy}>Acquire the source, scan for anomalies, then review the evidence before the vehicle is released.</p>
    </div>
    <div className={styles.appReady} role="status" aria-label="App status">
      <span className={styles.dot} aria-hidden="true" />
      App ready
    </div>
  </section>
);
