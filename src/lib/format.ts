/**
 * Formatting helpers shared across screens. Pure functions, no UI deps.
 */

/** Whole-dollar currency, e.g. 1234.5 -> "$1,235". */
export function formatDollars(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/** Cents-precise currency for receipt line items, e.g. 12.3 -> "$12.30". */
export function formatDollarsCents(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Compact large dollars for big federal figures, e.g. 1.2e12 -> "$1.2T". */
export function formatCompactDollars(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Percent from a 0..1 ratio, e.g. 0.234 -> "23.4%". */
export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Signed percent for stock changes, e.g. 0.012 -> "+1.20%". */
export function formatSignedPercent(ratio: number, digits = 2): string {
  const sign = ratio > 0 ? '+' : '';
  return `${sign}${(ratio * 100).toFixed(digits)}%`;
}

/** Relative time from a timestamp, e.g. "3h ago". Returns "" for null/now. */
export function timeAgo(ts: number | null, nowMs: number): string {
  if (!ts) return '';
  const sec = Math.max(0, Math.floor((nowMs - ts) / 1000));
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
