import {
  type OfferLocation,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {type Viewport} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Array, pipe} from 'effect'

function isPointInsideViewport({
  latitude,
  longitude,
  viewport,
}: {
  latitude: number
  longitude: number
  viewport: Viewport
}): boolean {
  return (
    viewport.northeast.longitude >= longitude &&
    viewport.southwest.longitude <= longitude &&
    viewport.southwest.latitude <= latitude &&
    viewport.northeast.latitude >= latitude
  )
}

export function isOfferPinInsideViewPort(
  viewport: Viewport,
  offer: OneOfferInState
): boolean {
  return pipe(
    offer.offerInfo.publicPart.location,
    Array.some((location) =>
      isOfferLocationPinInsideViewPort(viewport, location)
    )
  )
}

export function isOfferLocationPinInsideViewPort(
  viewport: Viewport,
  location: OfferLocation
): boolean {
  return isPointInsideViewport({
    latitude: location.latitude,
    longitude: location.longitude,
    viewport,
  })
}
