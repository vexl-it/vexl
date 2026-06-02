import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {atom} from 'jotai'
import {
  formatCurrency,
  formatDateTime,
  formatDecimal,
  formatPercent,
} from './formatting'
import {formattingLocaleAtom} from './formattingLocaleAtom'

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
      currency: string
      maximumFractionDigits?: number
      minimumFractionDigits?: number
    }
  ) => {
    const locale = get(formattingLocaleAtom)

    if (Number.isNaN(Number(number))) return number

    return formatCurrency(Number(number), currency, locale, {
      maximumFractionDigits,
      minimumFractionDigits,
    })
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
    const locale = get(formattingLocaleAtom)

    if (Number.isNaN(Number(number))) return number

    return formatDecimal(Number(number), locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    })
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
    const locale = get(formattingLocaleAtom)

    if (Number.isNaN(Number(number))) return number

    return formatPercent(Number(number), locale, {
      minimumFractionDigits,
    })
  }
)

export const localizedDateTimeActionAtom = atom(
  null,
  (get, set, {unixMilliseconds}: {unixMilliseconds: UnixMilliseconds}) => {
    const locale = get(formattingLocaleAtom)

    return formatDateTime(unixMilliseconds, locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }
)
