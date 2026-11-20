const MINUTE_MS = 60_000

/** `<input type="datetime-local">` value in the browser's time zone. */
export const toDateTimeLocal = (date: Date): string =>
  new Date(date.getTime() - date.getTimezoneOffset() * MINUTE_MS)
    .toISOString()
    .slice(0, 16)
