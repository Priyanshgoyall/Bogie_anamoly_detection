import React from 'react';
import { Moon, Sun } from 'lucide-react';
import styles from './Header.module.css';

type Theme = 'light' | 'dark';
interface Props { theme: Theme; onToggleTheme: () => void; }

export const Header: React.FC<Props> = ({ theme, onToggleTheme }) => (
  <header className={styles.topbar} role="banner">
    <a href="/" className={styles.brand} aria-label="BogieVision home">
      <span className={styles.brandMark} aria-hidden="true">
        {/* Inline SVG – bogie / wheel icon */}
        <svg className={styles.brandSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="8" width="20" height="9" rx="2" stroke="currentColor" strokeWidth="1.7"/>
          <circle cx="7"  cy="19" r="2" stroke="currentColor" strokeWidth="1.7"/>
          <circle cx="17" cy="19" r="2" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M7 8V5m10 3V5M2 13h20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
      </span>
      <span>
        <strong className={styles.brandName}>BogieVision</strong>
        <small className={styles.brandSub}>Foreign Object Inspection Console</small>
      </span>
    </a>

    <div className={styles.actions}>
      {/* Session badge */}
      <div className={styles.localSession} role="status" aria-label="Session type: local session">
        <span className={styles.checkIcon} aria-hidden="true">✓</span>
        Local session
      </div>

      {/* Theme toggle */}
      <button
        className={styles.iconBtn}
        id="themeToggle"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Operator avatar */}
      <div
        className={styles.avatar}
        style={{ display: 'grid', placeItems: 'center' }}
        aria-label="Operator: PV"
        role="img"
      >
        PV
      </div>
    </div>
  </header>
);
