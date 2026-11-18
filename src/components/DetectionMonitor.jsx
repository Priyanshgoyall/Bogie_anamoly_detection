import React from 'react';
import styles from './DetectionMonitor.module.css';

export const DetectionMonitor = ({
  scanStatus,
  progress,
  scanNumber,
  findingsCount,
}) => {
  const pillClass =
    scanStatus === 'scanning' ? styles.pillScanning :
    scanStatus === 'complete' ? styles.pillComplete :
    styles.pillIdle;
  const pillText =
    scanStatus === 'scanning' ? 'Scanning' :
    scanStatus === 'complete' ? 'Review needed' : 'Ready';
  const progressText =
    scanStatus === 'scanning' ? 'Analysing source' :
    scanStatus === 'complete' ? 'Analysis complete' : 'Analysis progress';

  return (
    <aside className={`glass-card ${styles.card}`} aria-label="Detection monitor">
      <div className={styles.titleRow}>
        <div>
          <p className="step-label">3. Monitor scan</p>
          <h2 className={styles.title}>Detection status</h2>
        </div>
        <span className={styles.glyph} aria-hidden="true">⌁</span>
      </div>
      <div className="rule" />

      {/* Simulation disclosure badge */}
      <div className={styles.simBadge} role="note" aria-label="Simulation disclosure">
        Simulated detection – not a validated vision model
      </div>

      <div className={styles.statusBox}>
        <div className={styles.statusRow}>
          <strong>System status</strong>
          <span className={`${styles.pill} ${pillClass}`} role="status" aria-live="polite">{pillText}</span>
        </div>
        <div className={styles.progressTrack} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Detection progress">
          <span className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progressLabel}>
          <span>{progressText}</span>
          <strong>{progress}%</strong>
        </div>
      </div>

      <div className={styles.recordBox}>
        <div>
          <strong>Result record</strong>
          <small id="recordText">
            {scanNumber > 0
              ? `Scan ${String(scanNumber).padStart(3, '0')} · ${findingsCount} review item${findingsCount !== 1 ? 's' : ''}`
              : 'Available after each scan'}
          </small>
        </div>
        <span className={styles.recordIcon} aria-hidden="true">⌗</span>
      </div>
    </aside>
  );
};
