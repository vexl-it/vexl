import {
  type LngLatBounds,
  type ViewState,
} from '@maplibre/maplibre-react-native'
import {Array, pipe} from 'effect'
import {type MapValue} from '../brands'
import {type LatLng, type Region} from '../types'

// Web-mercator latitude limit. Regions are unclamped (a zoomed-out region's
// latitude ± delta/2 can exceed the poles), but MapLibre only accepts valid
// coordinates.
const MAX_MERCATOR_LATITUDE = 85

export function regionToBounds(region: Region): LngLatBounds {
  return [
    region.longitude - region.longitudeDelta / 2,
    Math.max(
      region.latitude - region.latitudeDelta / 2,
      -MAX_MERCATOR_LATITUDE
    ),
    region.longitude + region.longitudeDelta / 2,
    Math.min(region.latitude + region.latitudeDelta / 2, MAX_MERCATOR_LATITUDE),
  ]
}

export function mapValueToBounds(mapValue: MapValue): LngLatBounds {
  const latitudeDelta = Math.abs(
    mapValue.viewport.northeast.latitude - mapValue.viewport.southwest.latitude
  )
  const longitudeDelta = Math.abs(
    mapValue.viewport.northeast.longitude -
      mapValue.viewport.southwest.longitude
  )

  return [
    mapValue.longitude - longitudeDelta / 2,
    mapValue.latitude - latitudeDelta / 2,
    mapValue.longitude + longitudeDelta / 2,
    mapValue.latitude + latitudeDelta / 2,
  ]
}

export function viewStateToRegion(viewState: ViewState): Region {
  const [west, south, east, north] = viewState.bounds
  // A viewport crossing the antimeridian reports east < west; unwrap the span.
  const longitudeDelta = east >= west ? east - west : east - west + 360

  return {
    latitude: viewState.center[1],
    longitude: viewState.center[0],
    latitudeDelta: Math.abs(north - south),
    longitudeDelta,
  }
}

export function coordinatesToBounds(
  coordinates: Array.NonEmptyReadonlyArray<LatLng>
): LngLatBounds {
  const first = Array.headNonEmpty(coordinates)
  const initialBounds: LngLatBounds = [
    first.longitude,
    first.latitude,
    first.longitude,
    first.latitude,
  ]

  return pipe(
    coordinates,
    Array.reduce(
      initialBounds,
      ([west, south, east, north], {latitude, longitude}): LngLatBounds => [
        Math.min(west, longitude),
        Math.min(south, latitude),
        Math.max(east, longitude),
        Math.max(north, latitude),
      ]
    )
  )
}
