import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {
  longitudeDeltaToMeters,
  type LatLong,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {Array, pipe} from 'effect'

const EARTH_RADIUS_METERS = 6_371_000

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180
}

function distanceInMeters(pointA: LatLong, pointB: LatLong): number {
  const latitudeA = degreesToRadians(pointA.latitude)
  const latitudeB = degreesToRadians(pointB.latitude)
  const latitudeDelta = degreesToRadians(pointB.latitude - pointA.latitude)
  const longitudeDelta = degreesToRadians(pointB.longitude - pointA.longitude)

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(latitudeA) *
      Math.cos(latitudeB) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2)

  return (
    EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  )
}

function locationRadiusInMeters(location: OfferLocation): number {
  return Math.abs(longitudeDeltaToMeters(location.radius, location.latitude))
}

export function doLocationCirclesOverlap({
  filterLocation,
  offerLocation,
}: {
  filterLocation: OfferLocation
  offerLocation: OfferLocation
}): boolean {
  return (
    distanceInMeters(filterLocation, offerLocation) <=
    locationRadiusInMeters(filterLocation) +
      locationRadiusInMeters(offerLocation)
  )
}

export function isLocationInsideCircularLocationFilter({
  location,
  locationFilter,
}: {
  location: OfferLocation
  locationFilter: readonly OfferLocation[] | undefined
}): boolean {
  const selectedLocationFilter = locationFilter ?? []
  if (!Array.isNonEmptyReadonlyArray(selectedLocationFilter)) return true

  return pipe(
    selectedLocationFilter,
    Array.some((filterLocation) =>
      doLocationCirclesOverlap({filterLocation, offerLocation: location})
    )
  )
}

export function filterLocationsByCircularLocationFilter({
  locations,
  locationFilter,
}: {
  locations: readonly OfferLocation[]
  locationFilter: readonly OfferLocation[] | undefined
}): OfferLocation[] {
  const selectedLocationFilter = locationFilter ?? []
  if (!Array.isNonEmptyReadonlyArray(selectedLocationFilter))
    return [...locations]

  return pipe(
    locations,
    Array.filter((location) =>
      isLocationInsideCircularLocationFilter({
        location,
        locationFilter: selectedLocationFilter,
      })
    )
  )
}

export function isAnyLocationInsideCircularLocationFilter({
  locations,
  locationFilter,
}: {
  locations: readonly OfferLocation[]
  locationFilter: readonly OfferLocation[] | undefined
}): boolean {
  const selectedLocationFilter = locationFilter ?? []
  if (!Array.isNonEmptyReadonlyArray(selectedLocationFilter)) return true

  return Array.isNonEmptyArray(
    filterLocationsByCircularLocationFilter({
      locations,
      locationFilter: selectedLocationFilter,
    })
  )
}
