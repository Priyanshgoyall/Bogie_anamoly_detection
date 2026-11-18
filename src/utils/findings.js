export function makeFindings(source) {
  if (source === 'demo') {
    return [
      {
        name: 'Loose material',
        severity: 'critical',
        confidence: 96,
        location: 'Centre cross-member',
        box: { left: 49, top: 48, width: 10, height: 16 },
        detail: 'Irregular material profile detected near the central frame member.',
      },
      {
        name: 'Metal debris',
        severity: 'low',
        confidence: 88,
        location: 'Brake-line zone',
        box: { left: 25, top: 36, width: 7, height: 10 },
        detail: 'Small high-contrast object requires visual confirmation.',
      },
    ];
  }
  const uploaded = source === 'upload';
  return [
    {
      name: uploaded ? 'Unverified object' : 'Possible obstruction',
      severity: 'critical',
      confidence: 89,
      location: 'Undercarriage zone B',
      box: { left: 51, top: 46, width: 12, height: 17 },
      detail: 'An anomaly differs from the expected undercarriage profile.',
    },
    {
      name: 'Surface anomaly',
      severity: 'low',
      confidence: 78,
      location: 'Outer equipment area',
      box: { left: 27, top: 34, width: 8, height: 11 },
      detail: 'Review illumination and hardware condition at this point.',
    },
  ];
}
