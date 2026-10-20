import React from 'react';
import type { Finding, DecisionRecord } from '../types';
import styles from './FindingsPanel.module.css';

interface Props {
  findings: Finding[];
  highAccuracy: boolean;
  decisionRecord: DecisionRecord | null;
  onRelease: () => void;
  onMaintenance: () => void;
  onExport: () => void;
  onNewScan: () => void;
}

export const FindingsPanel: React.FC<Props> = ({
  findings, highAccuracy, decisionRecord, onRelease, onMaintenance, onExport, onNewScan,
}) => {
  if (!findings.length) return null;
  const critical = findings.filter(f => f.severity === 'critical').length;
  const avg = Math.round(findings.reduce((s, f) => s + f.confidence, 0) / findings.length);

  return (
    <section className={`glass-card ${styles.section}`} aria-labelledby="evidenceTitle">
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">Inspection results</p>
          <h2 id="evidenceTitle">Evidence review</h2>
        </div>
        <div className={styles.actions}>
          <button className="btn-secondary" id="exportButton" onClick={onExport}>Export report</button>
          <button className="btn-secondary" id="newScanButton" onClick={onNewScan}>New scan</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className={styles.stats} role="list" aria-label="Scan summary">
        <div className={`${styles.stat} ${critical > 0 ? styles.statAlert : styles.statClear}`} role="listitem">
          <span>Review items</span>
          <strong>{findings.length}</strong>
        </div>
        <div className={styles.stat} role="listitem">
          <span>Simulated confidence</span>
          <strong>{avg}%</strong>
        </div>
        <div className={styles.stat} role="listitem">
          <span>Profile</span>
          <strong>{highAccuracy ? 'High' : 'Standard'}</strong>
        </div>
      </div>

      {/* Findings cards */}
      <div className={styles.grid} aria-label="Findings list">
        {findings.map((f, i) => (
          <article key={i} className={styles.finding}>
            <div className={styles.findingTop}>
              <h3>{i + 1}. {f.name}</h3>
              <span className={`${styles.severity} ${f.severity === 'critical' ? styles.sevCritical : styles.sevLow}`}>
                {f.severity}
              </span>
            </div>
            <p className={styles.findingDetail}>{f.detail}</p>
            <p className={styles.findingLoc}><b>Location:</b> {f.location}</p>
            <div className={styles.confidence}>
              Simulated confidence <b>{f.confidence}%</b>
            </div>
          </article>
        ))}
      </div>

      {/* Decision bar */}
      <DecisionPanel
        critical={critical}
        decisionRecord={decisionRecord}
        onRelease={onRelease}
        onMaintenance={onMaintenance}
      />
    </section>
  );
};

interface DPProps {
  critical: number;
  decisionRecord: DecisionRecord | null;
  onRelease: () => void;
  onMaintenance: () => void;
}

const DecisionPanel: React.FC<DPProps> = ({ critical, decisionRecord, onRelease, onMaintenance }) => {
  const locked = Boolean(decisionRecord);
  const isClear = critical === 0;

  const decisionLabel = decisionRecord
    ? decisionRecord.type === 'release' ? 'Released' : 'Maintenance required'
    : null;

  return (
    <div className={`${styles.decisionBar} ${isClear ? styles.decisionClear : ''} ${locked ? styles.decisionLocked : ''}`}
      role="region" aria-label="Decision panel">
      <div className={styles.decisionInfo}>
        <span className={`${styles.decisionDot} ${isClear ? styles.dotGreen : ''}`} aria-hidden="true" />
        <div>
          <strong className={styles.decisionTitle}>
            {locked
              ? decisionLabel
              : isClear
                ? 'No blocking items detected'
                : 'Operator review required'}
          </strong>
          <small className={styles.decisionDesc}>
            {locked
              ? `Decision recorded${decisionRecord ? ` · ${new Date(decisionRecord.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`
              : isClear
                ? 'The vehicle may be released after standard sign-off.'
                : 'Confirm the findings before choosing a release action.'}
          </small>
        </div>
      </div>
      {!locked && (
        <div className={styles.decisionActions}>
          <button className="btn-secondary" id="maintenanceButton" onClick={onMaintenance} aria-label="Mark vehicle for maintenance">
            Mark for maintenance
          </button>
          <button className="btn-primary" id="releaseButton" onClick={onRelease} aria-label="Release vehicle">
            Release vehicle
          </button>
        </div>
      )}
    </div>
  );
};
