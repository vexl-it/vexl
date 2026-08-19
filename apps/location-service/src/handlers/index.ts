import {HttpApiBuilder} from '@effect/platform/index'
import {LocationApiSpecification} from '@vexl-next/rest-api/src/services/location/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {GeocodingService} from '../geocoding'
import {GoogleMapsService} from '../utils/googleMapsApi'

export const getGeocodedCoordinatesHandler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getGeocodedCoordinates',
  (req) =>
    Effect.gen(function* (_) {
      const maps = yield* _(GoogleMapsService)
      return yield* _(maps.queryGeocode(req.urlParams))
    }).pipe(
      Effect.withSpan('getGeocodedCoordinatesHandler'),
      makeEndpointEffect
    )
)

export const getLocationSuggestionHandler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getLocationSuggestion',
  (req) =>
    Effect.gen(function* (_) {
      const maps = yield* _(GoogleMapsService)
      return yield* _(maps.querySuggest(req.urlParams))
    }).pipe(Effect.withSpan('getLocationSuggestionHandler'), makeEndpointEffect)
)

export const getGeocodedCoordinatesV2Handler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getGeocodedCoordinatesV2',
  (req) =>
    Effect.gen(function* (_) {
      const geocoding = yield* _(GeocodingService)
      return yield* _(geocoding.queryGeocode(req.urlParams))
    }).pipe(
      Effect.withSpan('getGeocodedCoordinatesV2Handler'),
      makeEndpointEffect
    )
)

export const getLocationSuggestionV2Handler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getLocationSuggestionV2',
  (req) =>
    Effect.gen(function* (_) {
      const geocoding = yield* _(GeocodingService)
      return yield* _(geocoding.querySuggest(req.urlParams))
    }).pipe(
      Effect.withSpan('getLocationSuggestionV2Handler'),
      makeEndpointEffect
    )
)
