import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {
  latitudeHelper,
  longitudeDeltaToMeters,
  longitudeHelper,
  metersToLatitudeDelta,
  type LatLong,
} from '@vexl-next/domain/src/utility/geoCoordinates'

export default function getOfferLocationBorderPoints(
  point: OfferLocation
): LatLong[] {
  const radiusInMeters = Math.abs(
    longitudeDeltaToMeters(point.radius, point.latitude)
  )
  const latitudeRadius = metersToLatitudeDelta(radiusInMeters)

  return [
    {
      latitude: latitudeHelper.add(point.latitude, latitudeRadius),
      longitude: longitudeHelper.add(point.longitude, point.radius),
    },
    {
      latitude: latitudeHelper.subtract(point.latitude, latitudeRadius),
      longitude: longitudeHelper.subtract(point.longitude, point.radius),
    },
  ]
}
