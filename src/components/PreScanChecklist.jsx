import React from 'react';
import styles from './PreScanChecklist.module.css';

const ITEMS = [
  { key: 'operatorAreaClear', label: 'Operator area clear' },
];

export const PreScanChecklist = ({ checklist, onChange }) => (
  <div className={`glass-card ${styles.card}`} aria-labelledby="checklistTitle">
    <p className="step-label">Pre-scan checklist</p>
    <h2 id="checklistTitle" className={styles.title}>Inspection readiness</h2>
    <div className={styles.list}>
      {ITEMS.map(({ key, label }) => (
        <label key={key} className={styles.item} htmlFor={`check-${key}`}>
          <input
            id={`check-${key}`}
            type="checkbox"
            className={styles.checkbox}
            checked={checklist[key]}
            onChange={e => onChange(key, e.target.checked)}
          />
          <span className={styles.label}>{label}</span>
        </label>
      ))}
    </div>
  </div>
);
