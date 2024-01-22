import {type LatLong} from '@vexl-next/domain/src/utility/geoCoordinates'

function distanceInKm(point1: LatLong, point2: LatLong): number {
  const R = 6371 // Radius of the Earth in kilometers
  const lat1 = Number(point1.latitude) * (Math.PI / 180)
  const long1 = Number(point1.longitude) * (Math.PI / 180)
  const lat2 = Number(point2.latitude) * (Math.PI / 180)
  const long2 = Number(point2.longitude) * (Math.PI / 180)

  const dLat = lat2 - lat1
  const dLong = long2 - long1

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLong / 2) * Math.sin(dLong / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Return distance in kilometers
  return R * c
}

export default function isSomeIn30KmRange(
  point: LatLong,
  toTest: LatLong[]
): boolean {
  return toTest.some((toTestPoint) => distanceInKm(point, toTestPoint) <= 30)
}
