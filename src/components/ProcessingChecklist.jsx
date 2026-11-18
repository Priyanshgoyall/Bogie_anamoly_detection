import React from 'react';
import { PROCESS_KEYS, PROCESS_LABELS } from '../types';
import styles from './ProcessingChecklist.module.css';

export const ProcessingChecklist = ({ processState, hasImage }) => {
  const completeCount = Object.values(processState).filter(Boolean).length;
  const total = PROCESS_KEYS.length;
  const summary = hasImage
    ? completeCount > 0
      ? `${completeCount} of ${total} processing checks complete.`
      : 'Awaiting scan start.'
    : 'Awaiting an inspection image.';

  return (
    <section className={`glass-card ${styles.card}`} aria-labelledby="pipelineTitle">
      <div className={styles.heading}>
        <div>
          <p className="step-label">Image preparation pipeline</p>
          <h2 id="pipelineTitle">Acquisition and processing checklist</h2>
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
              <span className={styles.marker} aria-hidden="true">
                <input
                  type="checkbox"
                  tabIndex={-1}
                  readOnly
                  checked={done}
                  aria-hidden="true"
                />
              </span>
              <span>
                <strong className={styles.stepLabel}>{label}</strong>
                <small className={styles.stepSub}>{sub}</small>
              </span>
              <em className={styles.stepStatus}>{done ? 'Complete' : 'Pending'}</em>
            </div>
          );
        })}
      </div>
    </section>
  );
};
