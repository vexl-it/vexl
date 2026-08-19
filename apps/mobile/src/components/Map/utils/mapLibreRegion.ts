import {
  type LngLatBounds,
  type ViewState,
} from '@maplibre/maplibre-react-native'
import {Array, Order, pipe} from 'effect'
import {type MapValue} from '../brands'
import {type LatLng, type Region} from '../types'

// Web-mercator latitude limit. Regions are unclamped (a zoomed-out region's
// latitude ± delta/2 can exceed the poles), but MapLibre only accepts valid
// coordinates.
const MAX_MERCATOR_LATITUDE = 85

export function getWrappedLongitudeSpan(west: number, east: number): number {
  // A viewport crossing the antimeridian reports east < west; unwrap the span.
  return east >= west ? east - west : east - west + 360
}

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
  const longitudeDelta = getWrappedLongitudeSpan(
    mapValue.viewport.southwest.longitude,
    mapValue.viewport.northeast.longitude
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

  return {
    latitude: viewState.center[1],
    longitude: viewState.center[0],
    latitudeDelta: Math.abs(north - south),
    longitudeDelta: getWrappedLongitudeSpan(west, east),
  }
}

export function coordinatesToBounds(
  coordinates: Array.NonEmptyReadonlyArray<LatLng>
): LngLatBounds {
  const first = Array.headNonEmpty(coordinates)
  const {south, north} = pipe(
    coordinates,
    Array.reduce(
      {south: first.latitude, north: first.latitude},
      ({south, north}, {latitude}) => ({
        south: Math.min(south, latitude),
        north: Math.max(north, latitude),
      })
    )
  )
  const coordinatesByLongitude = pipe(
    coordinates,
    Array.sortWith(({longitude}) => longitude, Order.number)
  )
  const {start, end} = pipe(
    Array.zip(
      coordinatesByLongitude,
      pipe(coordinatesByLongitude, Array.rotate(-1))
    ),
    Array.reduce(
      {start: first.longitude, end: first.longitude, span: 0},
      (largestGap, [startCoordinate, endCoordinate]) => {
        const span = getWrappedLongitudeSpan(
          startCoordinate.longitude,
          endCoordinate.longitude
        )

        return span > largestGap.span
          ? {
              start: startCoordinate.longitude,
              end: endCoordinate.longitude,
              span,
            }
          : largestGap
      }
    )
  )

  // The shortest bounds are the complement of the largest longitude gap.
  return [end, south, start, north]
}
