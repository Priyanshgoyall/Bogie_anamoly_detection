import React, { useRef } from 'react';
import { Upload, Camera, Play, RotateCcw } from 'lucide-react';
import styles from './SourceControls.module.css';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const SourceControls = ({
  cameraActive,
  hasImage,
  scanning,
  scanGates,
  onUpload,
  onCamera,
  onCapture,
  onEndFeed,
  onDemo,
  onStart,
  onClear,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-select same file
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Please select a PNG, JPEG, or WebP image.');
      return;
    }
    onUpload(file);
  };

  const canScan = !scanning;

  return (
    <aside className={`glass-card ${styles.card}`} aria-label="Source controls">
      <p className="step-label">1. Choose source</p>
      <h2 className={styles.title}>Inspection controls</h2>
      <div className="rule" />

      <input
        ref={fileInputRef}
        id="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        aria-label="Upload inspection image"
        onChange={handleFileChange}
      />

      <button
        className={`${styles.sourceBtn} ${!cameraActive && hasImage ? styles.selected : ''}`}
        id="uploadButton"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload image"
      >
        <span className={styles.sourceIcon}>
          <Upload size={22} />
        </span>
        <span>
          <strong>Upload image</strong>
          <small>PNG, JPEG, or WebP file</small>
        </span>
      </button>

      <button
        className={`${styles.sourceBtn} ${cameraActive ? styles.selected : ''}`}
        id="cameraButton"
        onClick={cameraActive ? onCapture : onCamera}
        aria-label={cameraActive ? 'Capture frame from camera' : 'Open live camera'}
      >
        <span className={`${styles.sourceIcon} ${!cameraActive ? styles.sourceMuted : ''}`}>
          <Camera size={22} />
        </span>
        <span>
          <strong>{cameraActive ? 'Capture frame' : 'Open live camera'}</strong>
          <small>{cameraActive ? 'Capture a still frame to inspect' : 'Use connected inspection feed'}</small>
        </span>
      </button>

      {cameraActive && (
        <button className={styles.endFeedBtn} id="endFeedButton" onClick={onEndFeed}>
          End feed
        </button>
      )}

      <button className={styles.demoBtn} id="demoButton" onClick={onDemo}>
        <span>◈</span> Load demonstration frame
      </button>

      <div className="rule" />
      <p className="step-label">2. Run inspection</p>

      <button
        className={`btn-primary ${styles.startBtn}`}
        id="startButton"
        disabled={scanning}
        onClick={onStart}
        aria-label="Start detection scan"
        aria-disabled={scanning}
      >
        <Play size={18} fill="currentColor" />
        <span>{scanning ? 'Scanning…' : 'Start detection'}</span>
      </button>

      {!scanGates.allowed && !scanning && (
        <ul className={styles.gateList} aria-label="Requirements to start scan" role="list">
          {scanGates.reasons.map((r, i) => (
            <li key={i} className={styles.gateItem}>
              {r}
            </li>
          ))}
        </ul>
      )}

      <button
        className={`btn-secondary ${styles.clearBtn}`}
        id="clearButton"
        onClick={onClear}
        aria-label="Clear workspace"
      >
        <RotateCcw size={16} /> Clear workspace
      </button>
    </aside>
  );
};
