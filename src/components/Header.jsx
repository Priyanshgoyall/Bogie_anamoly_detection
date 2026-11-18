import React from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './Header.module.css';

const BogieIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={styles.brandSvg}>
    <path
      d="M10 7v7m12-7v7M7 18c.5 4.6 3.6 7 9 7s8.5-2.4 9-7M8 14h16l2 5H6l2-5Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="11" cy="22" r="1.5" fill="currentColor" />
    <circle cx="21" cy="22" r="1.5" fill="currentColor" />
  </svg>
);

export const Header = ({ theme, onToggleTheme }) => (
  <header className={styles.topbar} role="banner">
    <a className={styles.brand} href="#" aria-label="BogieVision home">
      <span className={styles.brandMark} aria-hidden="true">
        <BogieIcon />
      </span>
      <span>
        <strong className={styles.brandName}>BogieVision</strong>
        <small className={styles.brandSub}>Foreign object inspection console</small>
      </span>
    </a>
    <div className={styles.actions}>
      <button
        className={styles.iconBtn}
        id="themeToggle"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title="Toggle colour mode"
        onClick={onToggleTheme}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className={styles.localSession} aria-label="Local session indicator">
        <span className={styles.checkIcon} aria-hidden="true">
          ✓
        </span>
        Local session
      </div>
      <button className={styles.avatar} aria-label="Operator profile" id="operatorAvatar">
        PV
      </button>
    </div>
  </header>
);
