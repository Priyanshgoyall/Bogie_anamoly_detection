import React from 'react';
import type { ActivityEntry } from '../types';
import { timeOnly } from '../utils/timestamp';
import styles from './ActivityLog.module.css';

interface Props { activity: ActivityEntry[]; }

const TONE_COLORS: Record<string, string> = {
  green: '#07b684', red: '#e24462', blue: '#5d92ff',
};

export const ActivityLog: React.FC<Props> = ({ activity }) => (
  <div className={`glass-card ${styles.card}`} aria-labelledby="activityTitle">
    <p className="step-label">Officer audit trail</p>
    <h2 id="activityTitle" className={styles.title}>Detection and decision log</h2>
    <div className={styles.list} aria-live="polite" aria-label="Activity log">
      {activity.length === 0 ? (
        <p className={styles.empty}>No inspection events yet.</p>
      ) : (
        activity.slice(0, 5).map(entry => (
          <div key={entry.id} className={styles.item}>
            <i className={styles.dot} style={{ background: TONE_COLORS[entry.tone] ?? '#5d92ff' }} aria-hidden="true" />
            <span className={styles.message}>{entry.message}</span>
            <time className={styles.time} dateTime={entry.at.toISOString()}>{timeOnly(entry.at)}</time>
          </div>
        ))
      )}
    </div>
  </div>
);
