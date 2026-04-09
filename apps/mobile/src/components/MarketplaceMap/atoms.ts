import {
  type OfferLocation,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {atom} from 'jotai'
import {filteredOffersForMapAtom} from '../../state/marketplace/atoms/filteredOffers'
import {focusedOfferAtom} from '../../state/marketplace/atoms/map/focusedOffer'

export const mapPointsAtom = atom((get) => {
  const offers = get(filteredOffersForMapAtom)

  return offers.flatMap((offer: OneOfferInState) => {
    const locations = offer.offerInfo.publicPart.location
    return locations.map((one: OfferLocation) => {
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
