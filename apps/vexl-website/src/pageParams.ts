import {Option} from 'effect'
import {notFound} from 'next/navigation'
import {toLocale, type Locale} from './i18n/locales'

export interface LocaleParams {
  readonly params: Promise<{locale: string}>
}

export async function resolveLocale({params}: LocaleParams): Promise<Locale> {
  return Option.getOrElse(toLocale((await params).locale), () => notFound())
}
