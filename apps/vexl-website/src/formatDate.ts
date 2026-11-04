import {intlLocale, type Locale} from './i18n/locales'

/** Formats a `YYYY-MM-DD` date the same way on the server and in the browser. */
export function formatDate(
  locale: Locale,
  isoDate: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`))
}
