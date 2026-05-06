import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
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

export default function isOfferInsideViewPort(
  viewport: Viewport,
  offer: OneOfferInState
): boolean {
  return pipe(
    offer.offerInfo.publicPart.location,
    Array.some((location) => {
      const locationArea = {
        northEast: {
          latitude: location.latitude + location.radius,
          longitude: location.longitude + location.radius,
        },
        southWest: {
          latitude: location.latitude - location.radius,
          longitude: location.longitude - location.radius,
        },
      }

      return (
        viewport.northeast.longitude >= locationArea.southWest.longitude &&
        viewport.southwest.longitude <= locationArea.northEast.longitude &&
        viewport.southwest.latitude <= locationArea.northEast.latitude &&
        viewport.northeast.latitude >= locationArea.southWest.latitude
      )
    })
  )
}

export function isOfferPinInsideViewPort(
  viewport: Viewport,
  offer: OneOfferInState
): boolean {
  return pipe(
    offer.offerInfo.publicPart.location,
    Array.some((location) =>
      isPointInsideViewport({
        latitude: location.latitude,
        longitude: location.longitude,
        viewport,
      })
    )
  )
}
