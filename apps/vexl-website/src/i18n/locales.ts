import {Array, type Option, pipe} from 'effect'
import {cs} from './cs'
import {en, type Messages} from './en'

export const locales = ['en', 'cs'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const messages: Record<Locale, Messages> = {en, cs}

export const intlLocale: Record<Locale, string> = {en: 'en-US', cs: 'cs-CZ'}

export function toLocale(value: string): Option.Option<Locale> {
  return pipe(
    locales,
    Array.findFirst((locale) => locale === value)
  )
}

/** English lives at the root, other locales under their own prefix. */
export function localizedPath(locale: Locale, path: string): string {
  if (locale === defaultLocale) return path
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'cs' : 'en'
}

export function formatMessage(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  )
}
