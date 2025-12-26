import {Schema} from 'effect'

export const Latitude = Schema.Number.pipe(
  Schema.greaterThanOrEqualTo(-90),
  Schema.lessThanOrEqualTo(90),
  Schema.brand('Latitude')
)
export type Latitude = Schema.Schema.Type<typeof Latitude>

export const Longitude = Schema.transform(Schema.Number, Schema.Number, {
  decode: (v): number => {
    const maxLongitude = 180
    const minLongitude = -180
    const range = maxLongitude - minLongitude
    return ((((v - minLongitude) % range) + range) % range) + minLongitude
  },
  encode: (v): number => v,
}).pipe(
  Schema.greaterThanOrEqualTo(-180),
  Schema.lessThanOrEqualTo(180),
  Schema.brand('Longitude')
)
export type Longitude = Schema.Schema.Type<typeof Longitude>

export interface LatLong {
  latitude: Latitude
  longitude: Longitude
}

export interface Viewport {
  center: LatLong
  northeast: LatLong
  southwest: LatLong
}

export const Radius = Schema.Number.pipe(
  Schema.positive(),
  Schema.brand('Radius')
)
export type Radius = Schema.Schema.Type<typeof Radius>

export function calculateViewportRadius(viewport: {
  northeast: LatLong
  southwest: LatLong
}): Radius {
  return Schema.decodeSync(Radius)(
    Math.abs(viewport.northeast.longitude - viewport.southwest.longitude) / 2
  )
}

const EARTH_RADIUS_METERS = 6_378_137

export const DEFAULT_RADIUS_METERS = 200

export function getDefaultRadius(latitude: Latitude): Radius {
  return Schema.decodeSync(Radius)(
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

export function longitudeDeltaToKilometers(
  longitudeDegDelta: number,
  latitudePoint: Latitude
): number {
  return longitudeDeltaToMeters(longitudeDegDelta, latitudePoint) / 1000
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
    return Schema.decodeSync(Latitude)(Math.max(Math.min(a + b, 90), -90))
  },
  subtract: (a: Latitude, b: number) => {
    return Schema.decodeSync(Latitude)(Math.max(Math.min(a - b, 90), -90))
  },
}

export const longitudeHelper = {
  add: (a: Longitude, b: number) => {
    return Schema.decodeSync(Longitude)(Math.max(Math.min(a + b, 180), -180))
  },
  subtract: (a: Longitude, b: number) => {
    return Schema.decodeSync(Longitude)(Math.max(Math.min(a - b, 180), -180))
  },
}
