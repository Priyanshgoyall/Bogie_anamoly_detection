// ─── Inspection Record ────────────────────────────────────────────────────────
export interface InspectionRecord {
  trainNumber: string;
  coachBogie: string;
  inspectionLocation: string;
  officerId: string;
}

// ─── Image Metadata ───────────────────────────────────────────────────────────
export interface ImageMetadata {
  source: string;
  status: string;
  resolution: string;
  fileSize: string;
  location: string;
  acquired: string;
  fileName?: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

// ─── Source Types ─────────────────────────────────────────────────────────────
export type SourceKind = 'upload' | 'camera' | 'demo' | null;

// ─── Image View Modes ─────────────────────────────────────────────────────────
export type ImageView = 'original' | 'grayscale' | 'threshold' | 'edges';

// ─── Processing Pipeline ──────────────────────────────────────────────────────
export type ProcessKey =
  | 'open'
  | 'display'
  | 'information'
  | 'grayscale'
  | 'blur'
  | 'threshold'
  | 'edges'
  | 'quality'
  | 'scan'
  | 'report';

export type ProcessState = Record<ProcessKey, boolean>;

export const PROCESS_KEYS: ProcessKey[] = [
  'open', 'display', 'information', 'grayscale', 'blur',
  'threshold', 'edges', 'quality', 'scan', 'report',
];

export const PROCESS_LABELS: Record<ProcessKey, { label: string; sub: string }> = {
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
export const QUALITY_MIN_WIDTH  = 640;
export const QUALITY_MIN_HEIGHT = 360;

// ─── Finding / Result ─────────────────────────────────────────────────────────
export type Severity = 'critical' | 'low';

export interface DetectionBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Finding {
  name: string;
  severity: Severity;
  confidence: number;
  location: string;
  detail: string;
  box: DetectionBox;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
export type LogTone = 'blue' | 'green' | 'red';

export interface ActivityEntry {
  id: string;
  message: string;
  tone: LogTone;
  at: Date;
}

// ─── Decision ────────────────────────────────────────────────────────────────
export type DecisionType = 'release' | 'maintenance';

export interface DecisionRecord {
  type: DecisionType;
  recordedAt: string;
}

// ─── Scan State ───────────────────────────────────────────────────────────────
export type ScanStatus = 'idle' | 'scanning' | 'complete';

// ─── Pre-scan Checklist ───────────────────────────────────────────────────────
export interface ChecklistState {
  lightingCalibration: boolean;
  vehicleIdRecorded: boolean;
  operatorAreaClear: boolean;
}

// ─── Report (export) ─────────────────────────────────────────────────────────
export interface ExportReport {
  application: string;
  generatedAt: string;
  simulationDisclosure: string;
  inspectionRecord: InspectionRecord;
  imageInformation: ImageMetadata;
  source: SourceKind;
  profile: string;
  processingChecks: ProcessState;
  decision: string;
  decisionRecord: DecisionRecord | null;
  findings: Omit<Finding, 'box'>[];
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'warn' | 'info' | '';

export interface ToastEntry {
  id: string;
  message: string;
  type: ToastType;
}

// ─── Scan Gate evaluation ─────────────────────────────────────────────────────
export interface ScanGateResult {
  allowed: boolean;
  reasons: string[];
}
