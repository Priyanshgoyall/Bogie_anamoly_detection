import React, { useState } from 'react';
import styles from './ImageViewer.module.css';

export const ImageViewer = ({
  imageUrl,
  cameraActive,
  hasImage,
  currentView = 'original',
  regions = [],
  naturalDimensions = { width: 0, height: 0 },
  annotatedImageUrl = null,
  scanStatus = 'idle',
  imageSourceLabel = '',
  videoRef,
  onSwitchView,
}) => {
  const [loadedDims, setLoadedDims] = useState({ width: 0, height: 0 });

  const handleImgLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setLoadedDims({ width: naturalWidth, height: naturalHeight });
    }
  };

  const isScanning = ['preparing', 'uploading', 'inferring', 'receiving'].includes(scanStatus);

  const refW = naturalDimensions.width || loadedDims.width || 1200;
  const refH = naturalDimensions.height || loadedDims.height || 720;

  const views = [
    { key: 'original', label: 'Original' },
    ...(annotatedImageUrl ? [{ key: 'annotated', label: 'AI Annotated' }] : []),
    { key: 'grayscale', label: 'Grayscale' },
    { key: 'threshold', label: 'Threshold' },
    { key: 'edges', label: 'Edge map' },
  ];

  // Overlays are shown on original view when backend regions exist
  const showOverlays = currentView === 'original' && regions && regions.length > 0;

  return (
    <section className={`glass-card ${styles.card}`} aria-label="Undercarriage image viewer">
      <div className={styles.header}>
        <div>
          <p className="step-label">Source view</p>
          <h2>Undercarriage image</h2>
        </div>
        <span className={styles.sourceTag}>
          {cameraActive ? 'Live feed' : hasImage ? (currentView === 'annotated' ? 'AI Annotated' : 'Image loaded') : 'Awaiting source'}
        </span>
      </div>
      <div className="rule" />

      <div
        className={`${styles.stage} ${!hasImage && !cameraActive ? styles.empty : ''}`}
        aria-label="Image stage"
      >
        {!hasImage && !cameraActive ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" width="38" height="38">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="8.5" cy="9" r="1.5" fill="currentColor" />
                <path
                  d="m4 18 5-5 3.5 3.5 2.5-2.5 5 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h3>No source selected</h3>
            <p>
              Upload a captured image, connect the
              <br />
              live inspection camera, or load a demo frame.
            </p>
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
              <div className={styles.imageHolder}>
                <img
                  src={imageUrl}
                  alt="Undercarriage inspection frame"
                  className={styles.image}
                  onLoad={handleImgLoad}
                />

                {/* Real Anomaly region bounding boxes */}
                {showOverlays && (
                  <div className={styles.overlayLayer} aria-label="Anomaly region overlays">
                    {regions.map((r, i) => {
                      const left = (r.x / refW) * 100;
                      const top = (r.y / refH) * 100;
                      const width = (r.width / refW) * 100;
                      const height = (r.height / refH) * 100;
                      const scoreText = typeof r.anomalyScore === 'number' ? ` · Score ${r.anomalyScore.toFixed(2)}` : '';

                      return (
                        <div
                          key={r.id || i}
                          className={`${styles.box} ${r.anomalyScore && r.anomalyScore > 0.3 ? styles.critical : styles.low}`}
                          style={{
                            left: `${Math.max(0, Math.min(100, left))}%`,
                            top: `${Math.max(0, Math.min(100, top))}%`,
                            width: `${Math.max(1, Math.min(100, width))}%`,
                            height: `${Math.max(1, Math.min(100, height))}%`,
                          }}
                          role="img"
                          aria-label={`Region ${i + 1}${scoreText}`}
                        >
                          <span className={styles.boxLabel}>
                            {i + 1}{scoreText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {isScanning && <div className={styles.scanLine} aria-label="Scanning in progress" />}

            <div className={styles.frameMeta} aria-hidden="true">
              {imageSourceLabel || (cameraActive ? 'CAM 01 · LIVE' : 'STILL FRAME')}
            </div>
          </div>
        )}
      </div>

      {/* Image metadata row */}
      <div className={styles.footer}>
        <span className={styles.footerInfo}>
          {hasImage || cameraActive ? 'Image metadata available' : 'No image metadata available'}
        </span>
        <span
          className={`${styles.readyDot} ${(hasImage || cameraActive) ? styles.live : ''}`}
          aria-hidden="true"
        />
      </div>

      {/* Image view toggle */}
      {hasImage && !cameraActive && (
        <div className={styles.tools} role="group" aria-label="Review view selector">
          <span className={styles.toolsLabel}>Review view</span>
          {views.map(v => (
            <button
              key={v.key}
              className={`${styles.viewBtn} ${currentView === v.key ? styles.viewActive : ''}`}
              data-view={v.key}
              onClick={() => onSwitchView(v.key)}
              aria-pressed={currentView === v.key}
              type="button"
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
