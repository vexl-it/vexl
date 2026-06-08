import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {type TFunction} from './localization/I18nProvider'
import {formatDate, formatDecimal} from './localization/formatting'

function formatFeeAmount(feeAmount: number, locale: string): string {
  return formatDecimal(Math.abs(feeAmount), locale, {
    maximumFractionDigits: 2,
  })
}

function shouldShowFeeLabelForListing(
  listingType: ListingType | undefined
): boolean {
  return !listingType || listingType === 'BITCOIN'
}

export function getOfferFeeLabel({
  feeAmount,
  listingType,
  locale,
  t,
  spaceAroundSign = false,
}: {
  readonly feeAmount: number | undefined
  readonly listingType?: ListingType
  readonly locale: string
  readonly t: TFunction
  readonly spaceAroundSign?: boolean
}): string {
  if (!shouldShowFeeLabelForListing(listingType)) return ''
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
    ? formatDate(new Date(expirationDate), locale, {
        dateStyle: 'short',
      })
    : ''
}

export function getOfferAmountDetailsLabel({
  feeAmount,
  listingType,
  expirationDate,
  locale,
  t,
}: {
  readonly feeAmount?: number
  readonly listingType?: ListingType
  readonly expirationDate?: string
  readonly locale: string
  readonly t: TFunction
}): string {
  const feeLabel = getOfferFeeLabel({feeAmount, listingType, locale, t})
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
