const MINUTE_MS = 60_000

/** `<input type="datetime-local">` value in the browser's time zone. */
export const toDateTimeLocal = (date: Date): string =>
  new Date(date.getTime() - date.getTimezoneOffset() * MINUTE_MS)
    .toISOString()
    .slice(0, 16)

const dateFormat = new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium'})
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Empty for a missing or partly typed value. */
const formatWith =
  (format: Intl.DateTimeFormat) =>
  (value: Date | string): string => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '' : format.format(date)
  }

export const formatDate = formatWith(dateFormat)
export const formatDateTime = formatWith(dateTimeFormat)
