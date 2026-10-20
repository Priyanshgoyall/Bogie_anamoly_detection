export function timestamp(): string {
  return new Date().toLocaleString([], {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function timeOnly(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
