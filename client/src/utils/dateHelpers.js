/**
 * Helper to get the number of days in a month.
 * @param {string} monthStr - Format "YYYY-MM" e.g., "2026-08"
 */
export function getDaysInMonth(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  // Month is 1-indexed in string, passing 0 as day gets the last day of previous month
  return new Date(year, month, 0).getDate();
}

/**
 * Helper to get the weekday index of the 1st of the month (0 = Sunday, 6 = Saturday).
 * Used for offsetting calendar grids.
 */
export function getFirstDayOffset(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Formats a "YYYY-MM" string to "Month Name Year" (e.g. "2026-08" -> "August 2026").
 */
export function formatMonthName(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
