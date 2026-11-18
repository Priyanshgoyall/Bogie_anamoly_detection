import React from 'react';
import styles from './Toast.module.css';

export const ToastRegion = ({ toasts, onRemove }) => (
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
