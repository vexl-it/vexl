import {Array, pipe} from 'effect'
import {DateTime} from 'luxon'
import {type TFunction} from './localization/I18nProvider'

function formatFeeAmount(feeAmount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(Math.abs(feeAmount))
}

export function getOfferFeeLabel({
  feeAmount,
  locale,
  t,
  spaceAroundSign = false,
}: {
  readonly feeAmount: number | undefined
  readonly locale: string
  readonly t: TFunction
  readonly spaceAroundSign?: boolean
}): string {
  if (feeAmount === undefined || feeAmount === 0) return ''

  const sign = feeAmount > 0 ? '+' : '-'
  const label =
    feeAmount > 0
      ? t('offerForm.premiumOrDiscount.premium')
      : t('offerForm.premiumOrDiscount.discount')
  const separator = spaceAroundSign ? ` ${sign} ` : ` ${sign}`

  return `${label}${separator}${formatFeeAmount(feeAmount, locale)}%`
}

export function formatOfferExpirationDate(
  expirationDate: string | undefined,
  locale: string
): string {
  return expirationDate
    ? DateTime.fromISO(expirationDate).toLocaleString(DateTime.DATE_SHORT, {
        locale,
      })
    : ''
}

export function getOfferAmountDetailsLabel({
  feeAmount,
  expirationDate,
  locale,
  t,
}: {
  readonly feeAmount?: number
  readonly expirationDate?: string
  readonly locale: string
  readonly t: TFunction
}): string {
  const feeLabel = getOfferFeeLabel({feeAmount, locale, t})
  const formattedExpirationDate = formatOfferExpirationDate(
    expirationDate,
    locale
  )
  const expirationLabel = formattedExpirationDate
    ? t('offerForm.expiration.expiresOn', {
        expirationDate: formattedExpirationDate,
      })
    : ''

  return pipe(
    [feeLabel, expirationLabel],
    Array.filter((label) => label.length > 0),
    Array.join(' • ')
  )
}
