import {atom} from 'jotai'
import {offersFilterStorageAtom} from '../../state/marketplace/atoms/filterAtoms'
import {filteredOffersIgnoreLocationAtom} from '../../state/marketplace/atoms/filteredOffers'
import {focusedOfferAtom} from '../../state/marketplace/atoms/map/focusedOffer'

export const mapPointsAtom = atom((get) => {
  const offers = get(filteredOffersIgnoreLocationAtom)
  const {filter} = get(offersFilterStorageAtom)

  return offers
    .filter(
      (one) =>
        one.offerInfo.publicPart.offerType === filter.offerType &&
        one.offerInfo.publicPart.listingType === filter.listingType
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
