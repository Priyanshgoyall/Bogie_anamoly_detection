import React from 'react';
import type { ProcessState } from '../types';
import { PROCESS_KEYS, PROCESS_LABELS } from '../types';
import styles from './ProcessingChecklist.module.css';

interface Props { processState: ProcessState; hasImage: boolean; }

export const ProcessingChecklist: React.FC<Props> = ({ processState, hasImage }) => {
  const completeCount = Object.values(processState).filter(Boolean).length;
  const total = PROCESS_KEYS.length;
  const summary = hasImage
    ? completeCount > 0
      ? `${completeCount} of ${total} checks complete`
      : 'Awaiting scan start'
    : 'Awaiting an inspection image';

  return (
    <section className={`glass-card ${styles.card}`} aria-labelledby="pipelineTitle">
      <div className={styles.heading}>
        <div>
          <p className="step-label">Image preparation pipeline</p>
          <h2 id="pipelineTitle">Acquisition &amp; processing checklist</h2>
        </div>
        <p className={styles.summary} aria-live="polite">{summary}</p>
      </div>
      <div className={styles.grid} role="list">
        {PROCESS_KEYS.map(key => {
          const done = processState[key];
          const { label, sub } = PROCESS_LABELS[key];
          return (
            <div
              key={key}
              className={`${styles.step} ${done ? styles.complete : ''}`}
              data-process={key}
              role="listitem"
              aria-label={`${label}: ${done ? 'complete' : 'pending'}`}
            >
              <div className={styles.stepTop}>
                <span className={styles.marker} aria-hidden="true">
                  <svg className={styles.markerCheck} viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className={styles.stepLabel}>{label}</span>
              </div>
              <span className={styles.stepSub}>{sub}</span>
              <em className={styles.stepStatus} aria-hidden="true">{done ? '✓ Complete' : 'Pending'}</em>
            </div>
          );
        })}
      </div>
    </section>
  );
};
