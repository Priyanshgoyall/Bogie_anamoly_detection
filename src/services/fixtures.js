/**
 * Test Fixtures for BogieVision Backend Integration
 * These fixtures match the integration contract for DINO + ViT anomaly detection.
 * Used exclusively for isolated testing/verification, NEVER as a production fallback.
 */

export const SAMPLE_DEFECT_RESPONSE = {
  status: 'success',
  verdict: 'DEFECT DETECTED',
  defect_percentage: 2.35,
  regions_count: 2,
  peak_score: 0.31,
  regions: [
    {
      id: 'region-1',
      x: 420,
      y: 180,
      width: 65,
      height: 42,
      anomaly_score: 0.31,
      description: 'Visual deviation detected by ViT feature memory bank near central bogie frame',
    },
    {
      id: 'region-2',
      x: 750,
      y: 320,
      width: 50,
      height: 38,
      anomaly_score: 0.24,
      description: 'Secondary anomalous feature pattern detected near outer axle beam',
    },
  ],
  annotated_image: null,
};

export const SAMPLE_NORMAL_RESPONSE = {
  status: 'success',
  verdict: 'NO DEFECT DETECTED',
  defect_percentage: 0.0,
  regions_count: 0,
  peak_score: 0.08,
  regions: [],
  annotated_image: null,
};
