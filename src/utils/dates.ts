import i18n from '@/i18n';

/** Parses an ISO `YYYY-MM-DD` string as a local date (avoids UTC shifts). */
export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export const todayIsoDate = () => toIsoDate(new Date());

export function formatDate(isoDate: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'long' }): string {
  if (!isoDate) {
    return '';
  }
  return new Intl.DateTimeFormat(i18n.language, options).format(parseIsoDate(isoDate));
}

export function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(timestamp);
}

export function formatMonth(isoDate: string): string {
  return new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(parseIsoDate(isoDate));
}

/** School years start in September: 2026-10-07 -> "2026-2027". */
export function toSchoolYear(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  const startYear = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}
