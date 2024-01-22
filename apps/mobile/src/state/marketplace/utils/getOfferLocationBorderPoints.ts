import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {
  latitudeHelper,
  longitudeHelper,
  type LatLong,
} from '@vexl-next/domain/src/utility/geoCoordinates'

export default function getOfferLocationBorderPoints(
  point: OfferLocation
): LatLong[] {
  return [
    {
      latitude: latitudeHelper.add(point.latitude, point.radius),
      longitude: longitudeHelper.add(point.longitude, point.radius),
    },
    {
      latitude: latitudeHelper.subtract(point.latitude, point.radius),
      longitude: longitudeHelper.subtract(point.longitude, point.radius),
    },
  ]
}
