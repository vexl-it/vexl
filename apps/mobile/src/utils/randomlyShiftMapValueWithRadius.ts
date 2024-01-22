import {
  latitudeHelper,
  longitudeHelper,
  metersAtLatitudeToDegreesLongitude,
  metersToLatitudeDelta,
  type LatLong,
  type Latitude,
  type Longitude,
} from '@vexl-next/domain/src/utility/geoCoordinates'

export default function randomlyShiftLatLong({
  latlong,
  maxMeters,
}: {
  latlong: LatLong
  maxMeters: number
}): {latitude: Latitude; longitude: Longitude} {
  const metersLatitudeShift = Math.random() * maxMeters - maxMeters / 2
  const metersLongitudeShift = Math.random() * maxMeters - maxMeters / 2

  const newLatitude = latitudeHelper.add(
    latlong.latitude,
    metersToLatitudeDelta(metersLatitudeShift)
  )
  const newLongitude = longitudeHelper.add(
    latlong.longitude,
    metersAtLatitudeToDegreesLongitude(metersLongitudeShift, newLatitude)
  )

  return {
    longitude: newLongitude,
    latitude: newLatitude,
  }
}
