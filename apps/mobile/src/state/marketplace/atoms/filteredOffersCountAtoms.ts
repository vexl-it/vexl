import {atom} from 'jotai'
import {listingTypeFilterAtom, offerTypeFilterAtom} from './filterAtoms'
import {offersToSeeInMarketplaceAtom} from './offersToSeeInMarketplace'

export const btcToCashOffersToSeeInMarketplaceCountAtom = atom((get) => {
  const offers = get(offersToSeeInMarketplaceAtom)

  return offers.filter(
    (offer) =>
      offer.offerInfo.publicPart.offerType === 'SELL' &&
      (!offer.offerInfo.publicPart.listingType ||
        offer.offerInfo.publicPart.listingType === 'BITCOIN')
  ).length
})

export const cashToBtcOffersToSeeInMarketplaceCountAtom = atom((get) => {
  const offers = get(offersToSeeInMarketplaceAtom)

  return offers.filter(
    (offer) =>
      offer.offerInfo.publicPart.offerType === 'BUY' &&
      (!offer.offerInfo.publicPart.listingType ||
        offer.offerInfo.publicPart.listingType === 'BITCOIN')
  ).length
})

export const btcToProductOffersToSeeInMarketplaceCountAtom = atom((get) => {
  const offers = get(offersToSeeInMarketplaceAtom)

  return offers.filter(
    (offer) =>
      offer.offerInfo.publicPart.offerType === 'BUY' &&
      offer.offerInfo.publicPart.listingType === 'PRODUCT'
  ).length
})

export const productToBtcOffersToSeeInMarketplaceCountAtom = atom((get) => {
  const offers = get(offersToSeeInMarketplaceAtom)

  return offers.filter(
    (offer) =>
      offer.offerInfo.publicPart.offerType === 'SELL' &&
      offer.offerInfo.publicPart.listingType === 'PRODUCT'
  ).length
})

export const sthElseOffersToSeeInMarketplaceCountAtom = atom((get) => {
  const offers = get(offersToSeeInMarketplaceAtom)

  return offers.filter(
    (offer) => offer.offerInfo.publicPart.listingType === 'OTHER'
  ).length
})

export const offersToSeeInMarketplaceCountAtom = atom((get) => {
  const listingType = get(listingTypeFilterAtom)
  const offerType = get(offerTypeFilterAtom)

  if (listingType === 'BITCOIN') {
    if (offerType === 'SELL')
      return get(btcToCashOffersToSeeInMarketplaceCountAtom)
    return get(cashToBtcOffersToSeeInMarketplaceCountAtom)
  }

  if (listingType === 'PRODUCT') {
    if (offerType === 'SELL')
      return get(productToBtcOffersToSeeInMarketplaceCountAtom)
    return get(btcToProductOffersToSeeInMarketplaceCountAtom)
  }

  return get(sthElseOffersToSeeInMarketplaceCountAtom)
})
