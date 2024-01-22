import {atom} from 'jotai'
import {filteredOffersIgnoreLocationAtom} from '../../state/marketplace/atoms/filteredOffers'
import {focusedOfferAtom} from '../../state/marketplace/atoms/map/focusedOffer'
import visibleMarketplaceSectionAtom from '../../state/marketplace/atoms/visibleMarketplaceSectionAtom'

export const mapPointsAtom = atom((get) => {
  const offers = get(filteredOffersIgnoreLocationAtom)
  const visibleMarketplaceSection = get(visibleMarketplaceSectionAtom)

  return offers
    .filter(
      (one) => one.offerInfo.publicPart.offerType === visibleMarketplaceSection
    )
    .flatMap((offer) => {
      const locations = offer.offerInfo.publicPart.location
      return locations.map((one) => {
        return {
          data: offer,
          id: `${offer.offerInfo.offerId}-${one.placeId}`,
          latitude: one.latitude,
          longitude: one.longitude,
          radius: one.radius,
        }
      })
    })
})

export const focusedPointsIdsAtom = atom((get) => {
  const focusedOfferId = get(focusedOfferAtom)
  if (!focusedOfferId) return undefined

  const focusedOffer = get(focusedOfferAtom)

  return (
    focusedOffer?.offerInfo.publicPart.location.map(
      (one) => `${focusedOffer.offerInfo.offerId}-${one.placeId}`
    ) ?? []
  )
})
