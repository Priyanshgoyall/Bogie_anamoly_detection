import React from 'react';
import type { ImageMetadata as IMetadata } from '../types';
import styles from './ImageMetadata.module.css';

interface Props { meta: IMetadata; }

export const ImageMetadata: React.FC<Props> = ({ meta }) => (
  <div className={styles.grid} aria-label="Image information">
    {([
      ['Source',          meta.source        || '—'],
      ['Status',          meta.status        || 'No image'],
      ['Resolution',      meta.resolution    || '—'],
      ['File size',       meta.fileSize      || '—'],
      ['Image location',  meta.location      || 'Not recorded'],
      ['Acquired',        meta.acquired      || '—'],
    ] as [string, string][]).map(([label, value]) => (
      <div key={label} className={styles.cell}>
        <span className={styles.label}>{label}</span>
        <strong className={styles.value} title={value}>{value}</strong>
      </div>
    ))}
  </div>
);
