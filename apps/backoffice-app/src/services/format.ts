const LOCALE = 'en-GB'

const dateFormat = new Intl.DateTimeFormat(LOCALE, {dateStyle: 'medium'})
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const timeFormat = new Intl.DateTimeFormat(LOCALE, {timeStyle: 'short'})
const numberFormat = new Intl.NumberFormat(LOCALE)

/** Empty for a missing or partly typed value. */
const formatWith =
  (format: Intl.DateTimeFormat) =>
  (value: Date | string): string => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '' : format.format(date)
  }

export const formatDate = formatWith(dateFormat)
export const formatDateTime = formatWith(dateTimeFormat)
export const formatTime = formatWith(timeFormat)

export const formatNumber = (value: number): string =>
  numberFormat.format(value)

/** A calendar day (a UTC midnight) without the year, for chart axes. */
export const formatUtcDayShort = (day: Date | string | number): string =>
  new Date(day).toLocaleDateString(LOCALE, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
