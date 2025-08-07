import {getLocales} from 'expo-localization'
import {atom} from 'jotai'
import {preferencesAtom} from '../preferences'

export const localizedPriceActionAtom = atom(
  null,
  (
    get,
    set,
    {
      number,
      currency,
      maximumFractionDigits,
      minimumFractionDigits,
    }: {
      number: string | number
      currency: string | undefined
      maximumFractionDigits?: number
      minimumFractionDigits?: number
    }
  ) => {
    const preferences = get(preferencesAtom)
    const locale =
      preferences.appLanguage ?? getLocales().at(0)?.languageTag ?? 'en-GB'

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'symbol',
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(Number(number))
  }
)

export const localizedDecimalNumberActionAtom = atom(
  null,
  (
    get,
    set,
    {
      number,
      minimumFractionDigits,
      maximumFractionDigits,
    }: {
      number: string | number
      minimumFractionDigits?: number
      maximumFractionDigits?: number
    }
  ) => {
    const preferences = get(preferencesAtom)
    const locale =
      preferences.appLanguage ?? getLocales().at(0)?.languageTag ?? 'en-GB'

    return Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(Number(number))
  }
)

export const localizedPercentActionAtom = atom(
  null,
  (
    get,
    set,
    {
      number,
      minimumFractionDigits,
    }: {number: string | number; minimumFractionDigits?: number}
  ) => {
    const preferences = get(preferencesAtom)
    const locale =
      preferences.appLanguage ?? getLocales().at(0)?.languageTag ?? 'en-GB'

    return Intl.NumberFormat(locale, {
      style: 'percent',

      minimumFractionDigits,
    }).format(Number(number))
  }
)
