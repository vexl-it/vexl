const FALLBACK_FORMATTING_LOCALE = 'en-US'

function isSupportedAppLanguageCode(locale: string): boolean {
  switch (locale) {
    case 'ar':
    case 'bg':
    case 'cs':
    case 'de':
    case 'es':
    case 'fa':
    case 'fi':
    case 'fr':
    case 'id':
    case 'it':
    case 'ja':
    case 'nl':
    case 'no':
    case 'pcm':
    case 'pl':
    case 'pt':
    case 'sk':
    case 'sv':
    case 'sw':
    case 'tr':
    case 'uk':
    case 'zh':
      return true
    default:
      return false
  }
}

export function normalizeFormattingLocale(locale: string | undefined): string {
  const normalizedLocale = locale?.trim().replace(/_/g, '-').toLowerCase()
  if (!normalizedLocale) return FALLBACK_FORMATTING_LOCALE

  if (
    normalizedLocale === 'dev' ||
    normalizedLocale === 'en' ||
    normalizedLocale === 'en-dev' ||
    normalizedLocale.startsWith('en-')
  ) {
    return FALLBACK_FORMATTING_LOCALE
  }

  if (isSupportedAppLanguageCode(normalizedLocale)) return normalizedLocale

  const languageCode = normalizedLocale.split('-').at(0)
  if (languageCode && isSupportedAppLanguageCode(languageCode)) {
    return languageCode
  }

  return FALLBACK_FORMATTING_LOCALE
}

export function formatDecimal(
  number: number,
  locale: string | undefined,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(normalizeFormattingLocale(locale), {
    style: 'decimal',
    ...options,
  }).format(number)
}

export function formatInteger(
  number: number,
  locale: string | undefined
): string {
  return formatDecimal(number, locale, {
    maximumFractionDigits: 0,
  })
}

export function formatCurrency(
  number: number,
  currency: string | undefined,
  locale: string | undefined,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(normalizeFormattingLocale(locale), {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    ...options,
  }).format(number)
}

export function formatPercent(
  number: number,
  locale: string | undefined,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(normalizeFormattingLocale(locale), {
    style: 'percent',
    ...options,
  }).format(number)
}

function hasExplicitDateTimeFormatComponent(
  options: Intl.DateTimeFormatOptions | undefined
): boolean {
  return (
    options?.weekday !== undefined ||
    options?.era !== undefined ||
    options?.year !== undefined ||
    options?.month !== undefined ||
    options?.day !== undefined ||
    options?.dayPeriod !== undefined ||
    options?.hour !== undefined ||
    options?.minute !== undefined ||
    options?.second !== undefined ||
    options?.fractionalSecondDigits !== undefined ||
    options?.timeZoneName !== undefined
  )
}

function withDateTimeFormatDefaults(
  defaults: Intl.DateTimeFormatOptions,
  options: Intl.DateTimeFormatOptions | undefined
): Intl.DateTimeFormatOptions {
  if (hasExplicitDateTimeFormatComponent(options)) return {...options}

  return {
    ...defaults,
    ...options,
  }
}

export function formatDate(
  date: Date | number,
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(
    normalizeFormattingLocale(locale),
    withDateTimeFormatDefaults({dateStyle: 'medium'}, options)
  ).format(date)
}

export function formatTime(
  date: Date | number,
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(
    normalizeFormattingLocale(locale),
    withDateTimeFormatDefaults({timeStyle: 'short'}, options)
  ).format(date)
}

export function formatDateTime(
  date: Date | number,
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(
    normalizeFormattingLocale(locale),
    withDateTimeFormatDefaults(
      {dateStyle: 'medium', timeStyle: 'short'},
      options
    )
  ).format(date)
}
