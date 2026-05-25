import {
  type LocationState,
  type OfferId,
  type OfferLocation,
} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {filterLocationsByCircularLocationFilter} from '../../state/marketplace/utils/circularLocationFilter'
import {type Point} from '../Map/components/MapDisplayMultiplePoints'

export interface OfferWithMapLocations {
  readonly offerInfo: {
    readonly offerId: OfferId
    readonly publicPart: {
      readonly location: readonly OfferLocation[]
      readonly locationState: readonly LocationState[]
    }
  }
}

export function offerHasVisibleMapLocation(
  offer: OfferWithMapLocations
): boolean {
  return (
    pipe(
      offer.offerInfo.publicPart.locationState,
      Array.some((state) => state === 'IN_PERSON')
    ) && Array.isNonEmptyReadonlyArray(offer.offerInfo.publicPart.location)
  )
}

export function createMapPointsForOffers<T extends OfferWithMapLocations>({
  offers,
  locationFilter,
}: {
  offers: readonly T[]
  locationFilter: readonly OfferLocation[] | undefined
}): ReadonlyArray<Point<T>> {
  return pipe(
    offers,
    Array.filter(offerHasVisibleMapLocation),
    Array.flatMap((offer) =>
      pipe(
        filterLocationsByCircularLocationFilter({
          locations: offer.offerInfo.publicPart.location,
          locationFilter,
        }),
        Array.map((one) => ({
          data: offer,
          id: `${offer.offerInfo.offerId}-${one.placeId}`,
          latitude: one.latitude,
          longitude: one.longitude,
        }))
      )
    )
  )
}
