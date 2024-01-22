import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type Viewport} from '@vexl-next/domain/src/utility/geoCoordinates'

export default function isOfferInsdieViewPort(
  viewport: Viewport,
  offer: OneOfferInState
): boolean {
  return offer.offerInfo.publicPart.location.some((location) => {
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

    // A is filter
    // B is offer
    // X is longitude
    // y is latitude
    // maxAx >= minBx && minAx <= maxBx && minAy <= maxBy && maxAy >= minBy
    return (
      viewport.northeast.longitude >= locationArea.southWest.longitude &&
      viewport.southwest.longitude <= locationArea.northEast.longitude &&
      viewport.southwest.latitude <= locationArea.northEast.latitude &&
      viewport.northeast.latitude >= locationArea.southWest.latitude
    )
  })
}
