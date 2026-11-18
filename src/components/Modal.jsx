import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

export const Modal = ({ open, title, body, symbol, symbolBg, onClose }) => {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Focus trap
  useEffect(() => {
    if (!open) return;

    closeBtnRef.current?.focus();
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label="Modal backdrop"
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
      >
        <button
          ref={closeBtnRef}
          className={styles.closeBtn}
          id="modalClose"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>
        <span
          className={styles.symbol}
          style={{ background: symbolBg }}
          aria-hidden="true"
        >
          {symbol}
        </span>
        <h2 id="modalTitle" className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
        <button className={`btn-primary ${styles.confirmBtn}`} id="modalConfirm" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};
