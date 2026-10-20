import type { ScanGateResult } from '../types';

export function evaluateScanGates({
  recordSaved,
  operatorAreaClear,
  hasStillImage,
}: {
  recordSaved: boolean;
  operatorAreaClear: boolean;
  hasStillImage: boolean;
}): ScanGateResult {
  const reasons: string[] = [];
  if (!recordSaved) reasons.push('Inspection record must be saved (train number and location required).');
  if (!operatorAreaClear) reasons.push('Operator area clear must be ticked.');
  if (!hasStillImage) reasons.push('A still image is required — capture a frame from the camera or upload an image.');
  return { allowed: reasons.length === 0, reasons };
}
