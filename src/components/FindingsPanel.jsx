import React from 'react';
import styles from './FindingsPanel.module.css';

export const FindingsPanel = ({
  inspectionResult,
  scanStatus,
  scanError,
  decisionRecord,
  onRelease,
  onMaintenance,
  onExport,
  onRetry,
}) => {
  // If not completed or no result, don't show unless there's an error to display
  if (!inspectionResult && scanStatus !== 'failed') return null;

  if (scanStatus === 'failed' && scanError) {
    return (
      <section className={`glass-card ${styles.section}`} aria-labelledby="evidenceTitle">
        <div className={styles.heading}>
          <div>
            <p className="eyebrow">Inspection status</p>
            <h2 id="evidenceTitle">AI Inference Error</h2>
          </div>
          {onRetry && (
            <div className={styles.actions}>
              <button className="btn-secondary" onClick={onRetry} type="button">
                ↻ Retry inspection
              </button>
            </div>
          )}
        </div>
        <div style={{
          padding: '16px 18px',
          borderRadius: 'var(--r)',
          background: 'var(--red-soft)',
          border: '1px solid var(--red-border)',
          color: 'var(--red-text)',
          fontSize: '13px',
          lineHeight: '1.6'
        }}>
          <strong>Connection or backend error:</strong> {scanError.message}
          <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--ink-2)' }}>
            Ensure your FastAPI backend is active at <code>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}</code> and reachable.
          </div>
        </div>
      </section>
    );
  }

  const { verdict, defectPercentage, regionsCount, peakScore, regions = [] } = inspectionResult;
  const isDefect = verdict === 'DEFECT DETECTED' || regionsCount > 0;

  return (
    <section className={`glass-card ${styles.section}`} aria-labelledby="evidenceTitle">
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">Inspection results</p>
          <h2 id="evidenceTitle">Evidence review</h2>
        </div>
        <div className={styles.actions}>
          <button className="btn-secondary" id="exportButton" onClick={onExport} type="button">
            Export report
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className={styles.stats} role="list" aria-label="Scan summary">
        <div className={`${styles.stat} ${isDefect ? styles.statAlert : styles.statClear}`} role="listitem">
          <span>Inspection Verdict</span>
          <strong style={{ fontSize: '18px', letterSpacing: '-0.01em' }}>
            {verdict}
          </strong>
        </div>
        <div className={`${styles.stat} ${isDefect ? styles.statAlert : styles.statClear}`} role="listitem">
          <span>Anomalous Regions</span>
          <strong>{regionsCount}</strong>
        </div>
        <div className={styles.stat} role="listitem">
          <span>Defect Coverage</span>
          <strong style={{ fontSize: '20px' }}>
            {defectPercentage !== null ? `${defectPercentage.toFixed(2)}%` : '—'}
          </strong>
        </div>
        <div className={styles.stat} role="listitem">
          <span>Peak Anomaly Score</span>
          <strong style={{ fontSize: '20px' }}>
            {peakScore !== null ? peakScore.toFixed(3) : '—'}
          </strong>
        </div>
      </div>

      {/* Findings cards or Clean normal state */}
      {regions.length > 0 ? (
        <div className={styles.grid} aria-label="Anomaly regions list">
          {regions.map((r, i) => (
            <article key={r.id || i} className={styles.finding}>
              <div className={styles.findingTop}>
                <h3>Region {i + 1}</h3>
                <span className={`${styles.severity} ${r.anomalyScore && r.anomalyScore > 0.3 ? styles.sevCritical : styles.sevLow}`}>
                  {r.anomalyScore !== null ? `Score: ${r.anomalyScore.toFixed(3)}` : 'Deviation'}
                </span>
              </div>
              <p className={styles.findingDetail}>
                {r.description || 'Visual deviation detected — requires operator verification.'}
              </p>
              <p className={styles.findingLoc}>
                <b>Coordinates (px):</b> X: {r.x}, Y: {r.y} · W: {r.width}, H: {r.height}
              </p>
              <div className={styles.confidence}>
                Status: <b>Operator verification required</b>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '18px 20px',
          borderRadius: 'var(--r)',
          background: 'var(--green-soft)',
          border: '1px solid var(--green-border)',
          color: 'var(--green-text)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }} aria-hidden="true">✓</span>
          <div>
            <strong>No anomalies detected</strong>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--ink-2)' }}>
              Vision Transformer (ViT) feature extraction matched the undercarriage profile against the normal memory bank without triggering deviation thresholds.
            </p>
          </div>
        </div>
      )}

      {/* Decision bar */}
      <DecisionPanel
        isDefect={isDefect}
        decisionRecord={decisionRecord}
        onRelease={onRelease}
        onMaintenance={onMaintenance}
      />
    </section>
  );
};

const DecisionPanel = ({ isDefect, decisionRecord, onRelease, onMaintenance }) => {
  const locked = Boolean(decisionRecord);

  const decisionLabel = decisionRecord
    ? decisionRecord.type === 'release' ? 'Released' : 'Maintenance required'
    : null;

  return (
    <div
      className={`${styles.decisionBar} ${!isDefect ? styles.decisionClear : ''} ${locked ? styles.decisionLocked : ''}`}
      role="region"
      aria-label="Decision panel"
    >
      <div className={styles.decisionInfo}>
        <span className={`${styles.decisionDot} ${!isDefect ? styles.dotGreen : ''}`} aria-hidden="true" />
        <div>
          <strong className={styles.decisionTitle}>
            {locked
              ? decisionLabel
              : !isDefect
                ? 'No anomalous regions detected — Operator sign-off required'
                : 'Visual deviations flagged — Operator disposition required'}
          </strong>
          <small className={styles.decisionDesc}>
            {locked
              ? `Decision recorded${decisionRecord ? ` · ${new Date(decisionRecord.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`
              : !isDefect
                ? 'Confirm the frame visually before signing off vehicle release.'
                : 'Review flagged regions on the undercarriage before selecting disposition.'}
          </small>
        </div>
      </div>
      {!locked && (
        <div className={styles.decisionActions}>
          <button
            className="btn-secondary"
            id="maintenanceButton"
            onClick={onMaintenance}
            aria-label="Mark vehicle for maintenance"
            type="button"
          >
            Mark for maintenance
          </button>
          <button
            className="btn-primary"
            id="releaseButton"
            onClick={onRelease}
            aria-label="Release vehicle"
            type="button"
          >
            Release vehicle
          </button>
        </div>
      )}
    </div>
  );
};
