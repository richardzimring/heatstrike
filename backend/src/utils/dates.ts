/**
 * Date formatting utilities
 */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Convert expiration dates to abbreviated word format
 * @example "2024-01-19" => "Jan 19"
 */
export function stringifyDates(dates: string[]): string[] {
  return dates.map((date) => {
    const parts = date.split('-');
    const month = parts[1] ?? '01';
    const day = parts[2] ?? '01';
    const monthIndex = parseInt(month, 10) - 1;
    const dayNum = parseInt(day, 10);
    const monthName = MONTHS[monthIndex] ?? 'Unknown';
    return `${monthName} ${dayNum}`;
  });
}
