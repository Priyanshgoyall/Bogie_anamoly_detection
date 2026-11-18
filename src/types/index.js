// ─── Processing Pipeline ──────────────────────────────────────────────────────
export const PROCESS_KEYS = [
  'open', 'display', 'information', 'grayscale', 'blur',
  'threshold', 'edges', 'quality', 'scan', 'report',
];

export const PROCESS_LABELS = {
  open:        { label: 'Open image',          sub: 'Source loaded' },
  display:     { label: 'Display image',       sub: 'Frame rendered' },
  information: { label: 'Image information',   sub: 'Metadata read' },
  grayscale:   { label: 'Grayscale',           sub: 'Luminance conversion' },
  blur:        { label: 'Blur',                sub: 'Noise reduction' },
  threshold:   { label: 'Threshold',           sub: 'Foreground isolation' },
  edges:       { label: 'Edge detection',      sub: 'Contour extraction' },
  quality:     { label: 'Quality gate',        sub: 'Min 640×360 check' },
  scan:        { label: 'Foreign-object scan', sub: 'Simulated scan' },
  report:      { label: 'Report record',       sub: 'Evidence exported' },
};

// ─── Quality Gate ─────────────────────────────────────────────────────────────
export const QUALITY_MIN_WIDTH = 640;
export const QUALITY_MIN_HEIGHT = 360;
