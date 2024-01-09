import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {type GetCryptocurrencyDetailsResponse} from '@vexl-next/rest-api/src/services/user/contracts'
import formatNumber from './formatNumber'

export function formatBtcPrice(
  currency: CurrencyCode,
  btcPrice: GetCryptocurrencyDetailsResponse | undefined
): string | undefined {
  return formatNumber(
    currency === 'USD'
      ? btcPrice?.priceUsd
      : currency === 'EUR'
      ? btcPrice?.priceEur
      : btcPrice?.priceCzk
  )
}
