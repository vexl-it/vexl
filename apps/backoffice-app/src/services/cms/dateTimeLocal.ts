const MINUTE_MS = 60_000

/** `<input type="datetime-local">` value in the browser's time zone. */
export const toDateTimeLocal = (date: Date): string =>
  new Date(date.getTime() - date.getTimezoneOffset() * MINUTE_MS)
    .toISOString()
    .slice(0, 16)

/** Empty for a missing or partly typed value. */
export const formatDateTime = (value: Date | string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}
