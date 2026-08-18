/** Formats a Date (or ISO string) for a `datetime-local` input. */
export function toLocalInput(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** Local calendar day (YYYY-MM-DD) for search `dateFrom` filters. */
export function todayIsoDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Shifts a `datetime-local` value by a whole number of minutes. */
export function shiftLocalInput(value: string, minutes: number): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return toLocalInput(date);
}
