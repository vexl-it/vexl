import {z} from 'zod'

export const Latitude = z.number().min(-90).max(90).brand<'latitude'>()
export type Latitude = z.TypeOf<typeof Latitude>

export const Longitude = z.number().min(-180).max(180).brand<'longitude'>()
export type Longitude = z.TypeOf<typeof Longitude>

export interface LatLong {
  latitude: Latitude
  longitude: Longitude
}

export interface Viewport {
  center: LatLong
  northeast: LatLong
  southwest: LatLong
}

export const Radius = z.number().min(0).brand<'radius'>()
export type Radius = z.TypeOf<typeof Radius>
export function calculateViewportRadius(viewport: {
  northeast: LatLong
  southwest: LatLong
}): Radius {
  return Radius.parse(
    Math.abs(viewport.northeast.longitude - viewport.southwest.longitude) / 2
  )
}

const EARTH_RADIUS_METERS = 6_378_137

export const DEFAULT_RADIUS_METERS = 200

export function getDefaultRadius(latitude: Latitude): Radius {
  return Radius.parse(
    metersAtLatitudeToDegreesLongitude(DEFAULT_RADIUS_METERS, latitude)
  )
}

export function latitudeDeltaToMeters(latitudeDelta: number): number {
  return latitudeDelta * 11_0574
}

export function metersToLatitudeDelta(latitudeMeters: number): number {
  return latitudeMeters / 11_0574
}

export function longitudeDeltaToMeters(
  longitudeDegDelta: number,
  latitudePoint: Latitude
): number {
  // Earth's radius in meters

  // Convert latitude from degrees to radians
  const latitudeRad = (latitudePoint * Math.PI) / 180

  // Calculate the distance represented by one degree of longitude in meters at the given latitude
  const metersPerDegLongitude =
    (Math.cos(latitudeRad) * (2 * Math.PI * EARTH_RADIUS_METERS)) / 360

  // Convert the longitude delta from degrees to meters
  return longitudeDegDelta * metersPerDegLongitude
}

export function metersAtLatitudeToDegreesLongitude(
  meters: number,
  latitudePoint: Latitude
): number {
  // Earth's radius in meters

  // Convert latitude from degrees to radians
  const latitudeRad = (latitudePoint * Math.PI) / 180

  // Calculate the distance represented by one degree of longitude in meters at the given latitude
  const metersPerDegLongitude =
    (Math.cos(latitudeRad) * (2 * Math.PI * EARTH_RADIUS_METERS)) / 360

  return meters / metersPerDegLongitude
}

export const latitudeHelper = {
  add: (a: Latitude, b: number) => {
    return Latitude.parse(Math.max(Math.min(a + b, 90), -90))
  },
  subtract: (a: Latitude, b: number) => {
    return Latitude.parse(Math.max(Math.min(a - b, 90), -90))
  },
}

export const longitudeHelper = {
  add: (a: Longitude, b: number) => {
    return Longitude.parse(Math.max(Math.min(a + b, 180), -180))
  },
  subtract: (a: Longitude, b: number) => {
    return Longitude.parse(Math.max(Math.min(a - b, 180), -180))
  },
}
