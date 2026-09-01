import {localeToLanguageCode} from '@vexl-next/domain/src/utility/LanguageCode.brand'
import {Option, Schema, pipe} from 'effect'

export const FormattingLocale = Schema.String.pipe(
  Schema.brand('FormattingLocale')
)
export type FormattingLocale = Schema.Schema.Type<typeof FormattingLocale>

const SupportedFormattingLanguage = Schema.Literal(
  'ar',
  'bg',
  'cs',
  'de',
  'es',
  'fa',
  'fi',
  'fr',
  'id',
  'it',
  'ja',
  'nl',
  'no',
  'pcm',
  'pl',
  'pt',
  'sk',
  'sv',
  'sw',
  'tr',
  'uk',
  'zh'
)

const toFormattingLocale = Schema.decodeSync(FormattingLocale)
const FALLBACK_FORMATTING_LOCALE = toFormattingLocale('en-US')

export function normalizeFormattingLocale(
  locale: string | undefined
): FormattingLocale {
  return pipe(
    Option.fromNullable(locale),
    Option.flatMap(localeToLanguageCode),
    Option.filter(Schema.is(SupportedFormattingLanguage)),
    Option.map(toFormattingLocale),
    Option.getOrElse(() => FALLBACK_FORMATTING_LOCALE)
  )
}

export function formatDecimal(
  number: number,
  locale: FormattingLocale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    ...options,
  }).format(number)
}

export function formatInteger(
  number: number,
  locale: FormattingLocale
): string {
  return formatDecimal(number, locale, {
    maximumFractionDigits: 0,
  })
}

export function formatCurrency(
  number: number,
  currency: string,
  locale: FormattingLocale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    ...options,
  }).format(number)
}

export function formatPercent(
  number: number,
  locale: FormattingLocale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
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
  locale: FormattingLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(
    locale,
    withDateTimeFormatDefaults({dateStyle: 'medium'}, options)
  ).format(date)
}

export function formatTime(
  date: Date | number,
  locale: FormattingLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(
    locale,
    withDateTimeFormatDefaults({timeStyle: 'short'}, options)
  ).format(date)
}

export function formatDateTime(
  date: Date | number,
  locale: FormattingLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(
    locale,
    withDateTimeFormatDefaults(
      {dateStyle: 'medium', timeStyle: 'short'},
      options
    )
  ).format(date)
}
