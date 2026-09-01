import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {Option, pipe} from 'effect'
import {getCurrentLocale} from './localization/I18nProvider'
import {currencies} from './localization/currency'
import {
  formatDateTime,
  formatDecimal,
  type FormattingLocale,
} from './localization/formatting'

export function formatBtcPrice(
  btcPriceData: BtcPriceDataWithState | undefined,
  currency: CurrencyCode,
  locale: FormattingLocale = getCurrentLocale()
): string | undefined {
  const btcPrice = btcPriceData?.btcPrice
  if (!btcPrice) return undefined

  const formattedPrice = formatDecimal(Math.round(btcPrice.BTC), locale)
  return `${formattedPrice} ${currencies[currency].symbol}`
}

export function formatBtcPriceUpdatedAt(
  btcPriceData: BtcPriceDataWithState | undefined,
  locale: FormattingLocale = getCurrentLocale()
): string | undefined {
  const btcPrice = btcPriceData?.btcPrice
  if (!btcPrice) return undefined

  return pipe(
    btcPrice.lastUpdatedAt,
    Option.match({
      onNone: () => undefined,
      onSome: (value) => formatDateTime(value, locale),
    })
  )
}
