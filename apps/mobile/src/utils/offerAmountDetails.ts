import {type ListingType} from '@vexl-next/domain/src/general/offers'
import {type JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'
import {DateTime} from 'luxon'
import {isOfferExpired} from './isOfferExpired'
import {type TFunction} from './localization/I18nProvider'
import {
  formatDate,
  formatDecimal,
  type FormattingLocale,
} from './localization/formatting'

function formatFeeAmount(feeAmount: number, locale: FormattingLocale): string {
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
  readonly locale: FormattingLocale
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
  expirationDate: JSDateString | undefined,
  locale: FormattingLocale
): string {
  return expirationDate
    ? formatDate(parseOfferExpirationDate(expirationDate), locale, {
        dateStyle: 'short',
      })
    : ''
}

export function parseOfferExpirationDate(expirationDate: JSDateString): Date {
  return DateTime.fromISO(expirationDate).toJSDate()
}

export function getOfferExpirationLabel({
  expirationDate,
  locale,
  t,
}: {
  readonly expirationDate?: JSDateString
  readonly locale: FormattingLocale
  readonly t: TFunction
}): string {
  const formattedExpirationDate = formatOfferExpirationDate(
    expirationDate,
    locale
  )
  return formattedExpirationDate
    ? t(
        isOfferExpired(expirationDate)
          ? 'offerForm.expiration.expiredOn'
          : 'offerForm.expiration.expiresOn',
        {
          expirationDate: formattedExpirationDate,
        }
      )
    : ''
}
