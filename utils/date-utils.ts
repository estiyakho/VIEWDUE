/**
 * Returns a date string in YYYY-MM-DD format based on the provided date.
 * This ensures consistency across the application for task history lookups.
 */
export function getHistoryDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the date string for "yesterday" or a specific number of days ago.
 */
export function getDaysAgoDateString(days = 1): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getHistoryDateString(d);
}
