/**
 * Get initials from a name string (max 2 chars).
 */
export const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

/**
 * Pad a score number to 4 digits for consistent leaderboard display.
 */
export const formatScore = (n = 0) => String(n).padStart(4, '0');

/**
 * Returns medal emoji for top 3 ranks, otherwise "#N".
 */
export const rankEmoji = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

/**
 * Returns a human-readable time string, e.g. "2m 30s ago".
 */
export const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/**
 * Truncates a string to `max` chars with ellipsis.
 */
export const truncate = (str = '', max = 40) =>
  str.length > max ? `${str.slice(0, max)}…` : str;
