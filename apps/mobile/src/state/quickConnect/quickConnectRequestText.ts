import {type OfferType} from '@vexl-next/domain/src/general/offers'
import {
  oppositeOfferType,
  type QuickConnectAmount,
} from '@vexl-next/domain/src/general/quickOffers'
import {formatFullCurrencyAmount} from '../../utils/localization/currency'
import {
  formatDecimal,
  type FormattingLocale,
} from '../../utils/localization/formatting'
import {type TFunction} from '../../utils/localization/I18nProvider'

export function formatQuickConnectAmount(
  amount: QuickConnectAmount,
  locale: FormattingLocale
): string {
  return amount._tag === 'BtcAmount'
    ? `${formatDecimal(amount.btc, locale, {maximumFractionDigits: 8})} BTC`
    : formatFullCurrencyAmount(amount.currency, amount.amount, locale)
}

// What the sender of a quick connect request says, rendered in the reader's
// language. The quick offer belongs to the receiver, so the sender wants the
// opposite of it.
export function quickConnectRequestText({
  quickOfferType,
  amount,
  locale,
  t,
}: {
  readonly quickOfferType: OfferType
  readonly amount: QuickConnectAmount | undefined
  readonly locale: FormattingLocale
  readonly t: TFunction
}): string {
  const request =
    oppositeOfferType(quickOfferType) === 'BUY'
      ? t('chatDetail.quickConnect.request.buy')
      : t('chatDetail.quickConnect.request.sell')
  if (!amount) return request

  return `${request} ${t('chatDetail.quickConnect.amount', {
    amount: formatQuickConnectAmount(amount, locale),
  })}`
}
