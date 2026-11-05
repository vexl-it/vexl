import {Array, type Option, pipe} from 'effect'

export const locales = ['en', 'cs'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

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

/** Pairs each locale's copy; Czech must have the same shape as English. */
export function localized<T>(messages: {
  readonly en: T
  readonly cs: NoInfer<T>
}): Record<Locale, T> {
  return messages
}
