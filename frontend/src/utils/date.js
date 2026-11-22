/**
 * Safely parses any date or timestamp string, especially SQLite's UTC "YYYY-MM-DD HH:MM:SS" without Z.
 * Guarantees proper parsing across all local timezones (e.g. UTC+7 in Cambodia).
 */
export function parseUtcDate(timestamp) {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'number') return new Date(timestamp);

  if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    // If it's SQLite CURRENT_TIMESTAMP "YYYY-MM-DD HH:MM:SS"
    if (!trimmed.endsWith('Z') && !trimmed.includes('+') && !trimmed.includes('T')) {
      const fixed = trimmed.replace(' ', 'T') + 'Z';
      const d = new Date(fixed);
      if (!isNaN(d.getTime())) return d;
    } else if (!trimmed.endsWith('Z') && !trimmed.includes('+') && trimmed.includes('T')) {
      const fixed = trimmed + 'Z';
      const d = new Date(fixed);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const parsed = new Date(timestamp);
  return !isNaN(parsed.getTime()) ? parsed : new Date();
}

/**
 * Calculates human-readable relative time (e.g. "Just now", "5 mins ago", "2 hrs ago").
 */
export function formatTimeAgo(timestamp) {
  try {
    const orderDate = parseUtcDate(timestamp);
    const diffMs = Date.now() - orderDate.getTime();
    const elapsedMinutes = Math.floor(diffMs / 60000);

    if (elapsedMinutes < 1) return 'Just now';
    if (elapsedMinutes === 1) return '1 min ago';
    if (elapsedMinutes < 60) return `${elapsedMinutes} mins ago`;
    const hours = Math.floor(elapsedMinutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } catch (e) {
    return 'Recently';
  }
}

/**
 * Returns elapsed minutes as number.
 */
export function getElapsedMinutes(timestamp) {
  try {
    const orderDate = parseUtcDate(timestamp);
    return Math.max(0, Math.floor((Date.now() - orderDate.getTime()) / 60000));
  } catch (e) {
    return 0;
  }
}
