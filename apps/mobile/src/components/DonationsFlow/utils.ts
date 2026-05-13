import {type InvoicePaymentMethod} from '@vexl-next/rest-api/src/services/content/contracts'
import {DateTime} from 'luxon'
import {type useTranslation} from '../../utils/localization/I18nProvider'

const MILLISECONDS_TIMESTAMP_MIN_VALUE = 10_000_000_000

export function donationTitle({
  paymentMethod,
  t,
}: {
  readonly paymentMethod: InvoicePaymentMethod
  readonly t: ReturnType<typeof useTranslation>['t']
}): string {
  switch (paymentMethod) {
    case 'BTC-LN':
    case 'BTC-LNURL':
      return t('donations.lightningDonation')
    case 'BTC-CHAIN':
      return t('donations.onChainDonation')
  }
}

export function timestampToDateTime(timestamp: number): DateTime {
  return timestamp < MILLISECONDS_TIMESTAMP_MIN_VALUE
    ? DateTime.fromSeconds(timestamp)
    : DateTime.fromMillis(timestamp)
}
