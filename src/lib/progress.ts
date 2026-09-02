export function clampProgress(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function formatProgress(value: number) {
  return `${clampProgress(value)}%`;
}
