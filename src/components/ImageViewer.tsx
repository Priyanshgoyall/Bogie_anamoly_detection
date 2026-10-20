import React from 'react';
import type { ImageView, Finding } from '../types';
import styles from './ImageViewer.module.css';

interface Props {
  imageUrl: string;
  cameraActive: boolean;
  hasImage: boolean;
  currentView: ImageView;
  findings: Finding[];
  scanning: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  onSwitchView: (v: ImageView) => void;
}

const VIEWS: { key: ImageView; label: string }[] = [
  { key: 'original',   label: 'Original' },
  { key: 'grayscale',  label: 'Grayscale' },
  { key: 'threshold',  label: 'Threshold' },
  { key: 'edges',      label: 'Edge map' },
];

export const ImageViewer: React.FC<Props> = ({
  imageUrl, cameraActive, hasImage, currentView, findings, scanning, videoRef, onSwitchView,
}) => {
  return (
    <section className={`glass-card ${styles.card}`} aria-label="Undercarriage image viewer">
      <div className={styles.header}>
        <div>
          <p className="step-label">Source view</p>
          <h2>Undercarriage image</h2>
        </div>
        <span className={styles.sourceTag}>
          {cameraActive ? 'Live feed' : hasImage ? 'Image loaded' : 'Awaiting source'}
        </span>
      </div>
      <div className="rule" />

      <div className={`${styles.stage} ${!hasImage && !cameraActive ? styles.empty : ''}`} aria-label="Image stage">
        {!hasImage && !cameraActive ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" width="38" height="38">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="8.5" cy="9" r="1.5" fill="currentColor"/>
                <path d="m4 18 5-5 3.5 3.5 2.5-2.5 5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <h3>No source selected</h3>
            <p>Upload a captured image or connect the<br/>live inspection camera to begin.</p>
          </div>
        ) : (
          <div className={styles.mediaWrap}>
            {cameraActive && (
              <video
                ref={videoRef}
                className={styles.video}
                autoPlay
                playsInline
                muted
                aria-label="Live camera feed"
              />
            )}
            {hasImage && !cameraActive && (
              <img
                src={imageUrl}
                alt="Undercarriage inspection frame"
                className={styles.image}
              />
            )}
            {scanning && <div className={styles.scanLine} aria-label="Scanning in progress" />}
            {/* Detection overlays */}
            <div className={styles.overlayLayer} aria-label="Detection overlays">
              {findings.map((f, i) => (
                <div
                  key={i}
                  className={`${styles.box} ${f.severity === 'critical' ? styles.critical : styles.low}`}
                  style={{ left: `${f.box.left}%`, top: `${f.box.top}%`, width: `${f.box.width}%`, height: `${f.box.height}%` }}
                  role="img"
                  aria-label={`${f.name} – ${f.severity} severity, ${f.confidence}% confidence`}
                >
                  <span className={styles.boxLabel}>{i + 1} · {f.name} {f.confidence}%</span>
                </div>
              ))}
            </div>
            <div className={styles.frameMeta} aria-hidden="true">CAM 02 · FRAME 4081</div>
          </div>
        )}
      </div>

      {/* Image metadata row */}
      <div className={styles.footer}>
        <span className={styles.footerInfo}>
          {hasImage || cameraActive ? 'Image metadata available' : 'No image metadata available'}
        </span>
        <span className={`${styles.readyDot} ${(hasImage || cameraActive) ? styles.live : ''}`} aria-hidden="true" />
      </div>

      {/* Image view toggle */}
      {hasImage && !cameraActive && (
        <div className={styles.tools} role="group" aria-label="Review view selector">
          <span className={styles.toolsLabel}>Review view</span>
          {VIEWS.map(v => (
            <button
              key={v.key}
              className={`${styles.viewBtn} ${currentView === v.key ? styles.viewActive : ''}`}
              data-view={v.key}
              onClick={() => onSwitchView(v.key)}
              aria-pressed={currentView === v.key}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
