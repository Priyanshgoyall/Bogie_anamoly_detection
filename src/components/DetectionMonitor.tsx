import React from 'react';
import { Play } from 'lucide-react';
import type { ScanStatus, ScanGateResult } from '../types';
import styles from './DetectionMonitor.module.css';

interface Props {
  scanStatus: ScanStatus;
  progress: number;
  highAccuracy: boolean;
  scanNumber: number;
  findingsCount: number;
  scanGates: ScanGateResult;
  scanning: boolean;
  onToggleAccuracy: () => void;
  onStart: () => void;
}

export const DetectionMonitor: React.FC<Props> = ({
  scanStatus, progress, highAccuracy, scanNumber, findingsCount,
  scanGates, scanning, onToggleAccuracy, onStart,
}) => {
  const pillClass =
    scanStatus === 'scanning' ? styles.pillScanning :
    scanStatus === 'complete' ? styles.pillComplete :
    styles.pillIdle;

  const pillText =
    scanStatus === 'scanning' ? 'Scanning…' :
    scanStatus === 'complete' ? 'Review needed' : 'Ready';

  const progressLabel =
    scanStatus === 'scanning' ? 'Analysing source image' :
    scanStatus === 'complete' ? 'Analysis complete' : 'Analysis progress';

  const canRun = scanGates.allowed && !scanning;

  return (
    <aside className={`glass-card ${styles.card}`} aria-label="Detection monitor">
      <div className={styles.titleRow}>
        <div>
          <p className="step-label">3 · Monitor scan</p>
          <h2 className={styles.title}>Detection status</h2>
        </div>
        <span className={styles.glyph} aria-hidden="true">⌁</span>
      </div>
      <div className="rule" />

      {/* Simulation disclosure – safety-critical, never rely on color alone */}
      <div className={styles.simBadge} role="note" aria-label="Simulation disclosure">
        Simulated detection · not a validated vision model
      </div>

      {/* Status box */}
      <div className={styles.statusBox}>
        <div className={styles.statusRow}>
          <span>System status</span>
          <span
            className={`${styles.pill} ${pillClass}`}
            role="status"
            aria-live="polite"
            aria-label={`Status: ${pillText}`}
          >
            <i className={styles.pillDot} aria-hidden="true" />
            {pillText}
          </span>
        </div>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Detection progress"
        >
          <span className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.progressLabel}>
          <span>{progressLabel}</span>
          <strong>{progress}%</strong>
        </div>
      </div>

      {/* Accuracy profile */}
      <p className={styles.profileLabel}>Simulation profile</p>
      <button
        className={styles.toggle}
        id="accuracyToggle"
        role="switch"
        aria-checked={highAccuracy}
        onClick={onToggleAccuracy}
        title="Toggle simulation accuracy profile — affects simulated confidence scores only"
      >
        <span>
          <strong>High accuracy mode</strong>
          <small>Affects simulated confidence scores only</small>
        </span>
        <i className={`${styles.toggleTrack} ${highAccuracy ? styles.toggleOn : ''}`} aria-hidden="true">
          <b className={styles.toggleThumb} />
        </i>
      </button>

      {/* Result record */}
      <div className={styles.recordBox}>
        <div>
          <strong>Result record</strong>
          <small id="recordText">
            {scanNumber > 0
              ? `Scan ${String(scanNumber).padStart(3, '0')} · ${findingsCount} review item${findingsCount !== 1 ? 's' : ''}`
              : 'Available after each completed scan'}
          </small>
        </div>
        <span className={styles.recordIcon} aria-hidden="true">⌗</span>
      </div>

      {/* Run button */}
      <button
        className={`btn-primary ${styles.runBtn}`}
        id="monitorRunButton"
        disabled={!canRun}
        onClick={onStart}
        aria-label="Run detection scan"
        aria-disabled={!canRun}
      >
        <Play size={15} fill="currentColor" />
        {scanning ? 'Scanning…' : 'Run detection'}
      </button>
    </aside>
  );
};
