import {Option} from 'effect'
import {notFound} from 'next/navigation'
import {locales, toLocale, type Locale} from './i18n/locales'

export interface LocaleParams {
  readonly params: Promise<{locale: string}>
}

export async function resolveLocale({params}: LocaleParams): Promise<Locale> {
  return Option.getOrElse(toLocale((await params).locale), () => notFound())
}

export function generateLocaleParams(): Array<{locale: string}> {
  return locales.map((locale) => ({locale}))
}

/** Page 2 onwards of a paginated list; page 1 lives at the list's own URL. */
export function parseListPage(
  param: string,
  pageCount: number
): Option.Option<number> {
  const page = Number(param)
  return Option.liftPredicate(
    page,
    () => /^[1-9]\d*$/.test(param) && page > 1 && page <= pageCount
  )
}

export function resolveListPage(param: string, pageCount: number): number {
  // proxy.ts already sent unknown pages to the 404 page
  return Option.getOrElse(parseListPage(param, pageCount), () => notFound())
}
