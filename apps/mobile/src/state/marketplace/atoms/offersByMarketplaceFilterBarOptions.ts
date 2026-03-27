import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import {type MarketplaceFilterBarOption} from '../domain'
import {filterBarOptionsAtom} from './filterAtoms'
import {offersToSeeInMarketplaceAtom} from './offersToSeeInMarketplace'

export function isBtcOffer(offer: OneOfferInState): boolean {
  return (
    !offer.offerInfo.publicPart.listingType ||
    offer.offerInfo.publicPart.listingType === 'BITCOIN'
  )
}

export function offerMatchesMarketplaceFilterBarOption(
  offer: OneOfferInState,
  option: MarketplaceFilterBarOption
): boolean {
  if (option === 'BUY_BTC')
    return offer.offerInfo.publicPart.offerType === 'SELL' && isBtcOffer(offer)

  if (option === 'SELL_BTC')
    return offer.offerInfo.publicPart.offerType === 'BUY' && isBtcOffer(offer)

  if (option === 'BUY_PRODUCT')
    return (
      offer.offerInfo.publicPart.offerType === 'SELL' &&
      offer.offerInfo.publicPart.listingType === 'PRODUCT'
    )

  if (option === 'SELL_PRODUCT')
    return (
      offer.offerInfo.publicPart.offerType === 'BUY' &&
      offer.offerInfo.publicPart.listingType === 'PRODUCT'
    )

  if (option === 'HIRE_SERVICE')
    return (
      offer.offerInfo.publicPart.offerType === 'SELL' &&
      offer.offerInfo.publicPart.listingType === 'OTHER'
    )

  return (
    offer.offerInfo.publicPart.offerType === 'BUY' &&
    offer.offerInfo.publicPart.listingType === 'OTHER'
  )
}

export const offersByMarketplaceFilterBarOptionsAtom = atom((get) => {
  const offers = get(offersToSeeInMarketplaceAtom)

  return {
    BUY_BTC: pipe(
      offers,
      Array.filter((offer) =>
        offerMatchesMarketplaceFilterBarOption(offer, 'BUY_BTC')
      )
    ),
    SELL_BTC: pipe(
      offers,
      Array.filter((offer) =>
        offerMatchesMarketplaceFilterBarOption(offer, 'SELL_BTC')
      )
    ),
    BUY_PRODUCT: pipe(
      offers,
      Array.filter((offer) =>
        offerMatchesMarketplaceFilterBarOption(offer, 'BUY_PRODUCT')
      )
    ),
    SELL_PRODUCT: pipe(
      offers,
      Array.filter((offer) =>
        offerMatchesMarketplaceFilterBarOption(offer, 'SELL_PRODUCT')
      )
    ),
    HIRE_SERVICE: pipe(
      offers,
      Array.filter((offer) =>
        offerMatchesMarketplaceFilterBarOption(offer, 'HIRE_SERVICE')
      )
    ),
    PROVIDE_SERVICE: pipe(
      offers,
      Array.filter((offer) =>
        offerMatchesMarketplaceFilterBarOption(offer, 'PROVIDE_SERVICE')
      )
    ),
  } satisfies Record<MarketplaceFilterBarOption, OneOfferInState[]>
})

export const offersSelectedByMarketplaceFilterBarOptionsAtom = atom((get) => {
  const selectedOptions = get(filterBarOptionsAtom)

  if (selectedOptions.size === 0) return get(offersToSeeInMarketplaceAtom)

  const offersByOption = get(offersByMarketplaceFilterBarOptionsAtom)

  return pipe(
    Array.fromIterable(selectedOptions),
    Array.flatMap((option) => offersByOption[option])
  )
})

export const offersToSeeInMarketplaceCountAtom = atom((get) => {
  return get(offersSelectedByMarketplaceFilterBarOptionsAtom).length
})
