import React from 'react';
import styles from './DetectionMonitor.module.css';

const STATE_CONFIG = {
  idle: {
    pillClass: styles.pillIdle,
    pillText: 'Ready',
    label: 'Analysis progress',
    statusText: 'Awaiting scan trigger',
    progressPct: 0,
    isBusy: false,
  },
  preparing: {
    pillClass: styles.pillScanning,
    pillText: 'Preparing image',
    label: 'Preparing frame',
    statusText: 'Formatting frame & metadata...',
    progressPct: null,
    isBusy: true,
  },
  uploading: {
    pillClass: styles.pillScanning,
    pillText: 'Uploading',
    label: 'Sending to backend',
    statusText: 'POST /api/inspect...',
    progressPct: null,
    isBusy: true,
  },
  inferring: {
    pillClass: styles.pillScanning,
    pillText: 'Inference running',
    label: 'AI Inference',
    statusText: 'DINO + ViT anomaly scoring...',
    progressPct: null,
    isBusy: true,
  },
  receiving: {
    pillClass: styles.pillScanning,
    pillText: 'Receiving',
    label: 'Parsing payload',
    statusText: 'Validating anomaly regions...',
    progressPct: null,
    isBusy: true,
  },
  complete: {
    pillClass: styles.pillComplete,
    pillText: 'Inference complete',
    label: 'AI analysis',
    statusText: 'Results verified',
    progressPct: 100,
    isBusy: false,
  },
  failed: {
    pillClass: styles.pillFailed,
    pillText: 'Inference failed',
    label: 'Error',
    statusText: 'Request could not complete',
    progressPct: 0,
    isBusy: false,
  },
  cancelled: {
    pillClass: styles.pillIdle,
    pillText: 'Cancelled',
    label: 'Cancelled',
    statusText: 'Request aborted by operator',
    progressPct: 0,
    isBusy: false,
  },
};

export const DetectionMonitor = ({
  scanStatus = 'idle',
  scanError = null,
  scanNumber = 0,
  regionsCount = 0,
  verdict = null,
  onRetry = () => {},
}) => {
  const config = STATE_CONFIG[scanStatus] || STATE_CONFIG.idle;

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

      {/* Backend Integration target info */}
      <div className={styles.backendBadge} role="note" aria-label="AI Model Information">
        DINO + ViT Anomaly Detection · FastAPI
      </div>

      <div className={styles.statusBox}>
        <div className={styles.statusRow}>
          <strong>System status</strong>
          <span className={`${styles.pill} ${config.pillClass}`} role="status" aria-live="polite">
            {config.pillText}
          </span>
        </div>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={config.progressPct ?? 50}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Detection progress"
        >
          <span
            className={`${styles.progressBar} ${config.isBusy ? styles.progressBarIndeterminate : ''}`}
            style={{ width: config.progressPct !== null ? `${config.progressPct}%` : undefined }}
          />
        </div>

        <div className={styles.progressLabel}>
          <span>{config.label}</span>
          <strong>{config.statusText}</strong>
        </div>

        {scanStatus === 'failed' && scanError && (
          <div className={styles.errorBox} role="alert">
            <div className={styles.errorHeader}>
              <span>Connection / API Error</span>
              {scanError.status ? <small>HTTP {scanError.status}</small> : null}
            </div>
            <div>{scanError.message}</div>
            <button
              className={styles.retryBtn}
              onClick={onRetry}
              type="button"
            >
              ↻ Retry inspection
            </button>
          </div>
        )}
      </div>

      <div className={styles.recordBox}>
        <div>
          <strong>Result record</strong>
          <small id="recordText">
            {scanNumber > 0 && verdict
              ? `Scan ${String(scanNumber).padStart(3, '0')} · ${verdict} (${regionsCount} region${regionsCount !== 1 ? 's' : ''})`
              : scanStatus === 'complete'
                ? `Scan ${String(scanNumber).padStart(3, '0')} · Completed`
                : 'Available after each inspection'}
          </small>
        </div>
        <span className={styles.recordIcon} aria-hidden="true">⌗</span>
      </div>
    </aside>
  );
};
