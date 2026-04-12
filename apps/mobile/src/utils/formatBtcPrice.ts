import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {Option, pipe} from 'effect'
import {DateTime} from 'luxon'
import {currencies} from './localization/currency'

export function formatBtcPrice(
  btcPriceData: BtcPriceDataWithState | undefined,
  currency: CurrencyCode
): string | undefined {
  const btcPrice = btcPriceData?.btcPrice
  if (!btcPrice) return undefined

  const formattedPrice = Intl.NumberFormat().format(Math.round(btcPrice.BTC))
  return `${formattedPrice} ${currencies[currency].symbol}`
}

export function formatBtcPriceUpdatedAt(
  btcPriceData: BtcPriceDataWithState | undefined
): string | undefined {
  const btcPrice = btcPriceData?.btcPrice
  if (!btcPrice) return undefined

  return pipe(
    btcPrice.lastUpdatedAt,
    Option.match({
      onNone: () => undefined,
      onSome: (value) =>
        DateTime.fromMillis(value).toLocaleString(DateTime.DATETIME_MED),
    })
  )
}
