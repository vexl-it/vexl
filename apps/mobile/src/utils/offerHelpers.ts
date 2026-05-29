import {
  type ListingType,
  type OfferType,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type IconTagVariant} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {formatFullCurrencyAmount} from './localization/currency'
import {i18n} from './localization/I18nProvider'
import spokenLanguageToFlagEmoji from './localization/spokenLanguageToFlagEmoji'

export function getIsOffering(
  _listingType: ListingType | undefined,
  offerType: OfferType
): boolean {
  return offerType === 'SELL'
}

export function getIconTagVariant(
  listingType: ListingType | undefined
): IconTagVariant {
  if (listingType === 'PRODUCT') return 'product'
  if (listingType === 'OTHER') return 'service'
  return 'bitcoin'
}

export function getAmountLabel(offer: OneOfferInState): string {
  const {publicPart} = offer.offerInfo

  const formatAmount = (amount: number): string =>
    formatFullCurrencyAmount(publicPart.currency, amount)

  if (!publicPart.listingType || publicPart.listingType === 'BITCOIN') {
    if (publicPart.amountBottomLimit > 0) {
      return `${formatAmount(publicPart.amountBottomLimit)} \u2013 ${formatAmount(publicPart.amountTopLimit)}`
    }

    return `${i18n.t('offer.upTo')} ${formatAmount(publicPart.amountTopLimit)}`
  }

  if (publicPart.amountBottomLimit !== 0) {
    return formatAmount(publicPart.amountBottomLimit)
  }

  if (
    publicPart.listingType === 'PRODUCT' ||
    publicPart.listingType === 'OTHER'
  ) {
    return i18n.t('offer.forFree')
  }

  return ''
}

export function getLocationLabels(offer: OneOfferInState): readonly string[] {
  return pipe(
    offer.offerInfo.publicPart.location,
    Array.map((loc) => loc.shortAddress || loc.address)
  )
}

export function getPaymentMethodLabel(
  offer: OneOfferInState,
  labels: {
    readonly cash: string
    readonly bank: string
    readonly revolut: string
    readonly lightning: string
    readonly onChain: string
  }
): string {
  const {publicPart} = offer.offerInfo
  const parts: string[] = []

  pipe(
    publicPart.paymentMethod,
    Array.forEach((method) => {
      if (method === 'CASH') {
        parts.push(labels.cash)
      } else if (method === 'BANK') {
        parts.push(labels.bank)
      } else if (method === 'REVOLUT') {
        parts.push(labels.revolut)
      }
    })
  )

  pipe(
    publicPart.btcNetwork,
    Array.forEach((network) => {
      if (network === 'LIGHTING') {
        parts.push(labels.lightning)
      } else if (network === 'ON_CHAIN') {
        parts.push(labels.onChain)
      }
    })
  )

  return parts.join(' • ')
}

export function getLanguagesLabel(offer: OneOfferInState): string {
  return pipe(
    offer.offerInfo.publicPart.spokenLanguages,
    Array.map(spokenLanguageToFlagEmoji),
    (languages) => languages.join(' ')
  )
}
