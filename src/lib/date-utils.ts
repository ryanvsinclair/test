import { formatDistanceToNow } from 'date-fns';

/**
 * Safe wrapper for formatDistanceToNow
 * Returns "—" if date is invalid, null, or undefined
 * NEVER throws
 */
export function safeDistanceToNow(
  value: string | Date | number | null | undefined,
  options?: { addSuffix?: boolean }
): string {
  if (!value) {
    return '—';
  }

  try {
    const date = value instanceof Date ? value : new Date(value);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—';
    }

    return formatDistanceToNow(date, options);
  } catch {
    return '—';
  }
}
