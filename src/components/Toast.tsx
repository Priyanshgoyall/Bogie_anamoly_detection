import React from 'react';
import type { ToastEntry } from '../types';
import styles from './Toast.module.css';

interface Props { toasts: ToastEntry[]; onRemove: (id: string) => void; }

export const ToastRegion: React.FC<Props> = ({ toasts, onRemove }) => (
  <div className={styles.region} id="toastRegion" aria-live="polite" aria-atomic="false" aria-label="Notifications">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`${styles.toast} ${t.type === 'success' ? styles.success : t.type === 'warn' ? styles.warn : ''}`}
        role="status"
      >
        <span>{t.message}</span>
        <button onClick={() => onRemove(t.id)} className={styles.dismiss} aria-label="Dismiss notification">×</button>
      </div>
    ))}
  </div>
);
