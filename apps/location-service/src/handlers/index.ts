import {LocationApiSpecification} from '@vexl-next/rest-api/src/services/location/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {GeocodingService} from '../geocoding'
import {GoogleMapsService} from '../utils/googleMapsApi'

export const getGeocodedCoordinatesHandler = makeHttpApiHandler(
  LocationApiSpecification,
  'root',
  'getGeocodedCoordinates',
  (req) =>
    Effect.gen(function* () {
      const maps = yield* GoogleMapsService
      return yield* maps.queryGeocode(req.query)
    }).pipe(
      Effect.withSpan('getGeocodedCoordinatesHandler'),
      makeEndpointEffect
    )
)

export const getLocationSuggestionHandler = makeHttpApiHandler(
  LocationApiSpecification,
  'root',
  'getLocationSuggestion',
  (req) =>
    Effect.gen(function* () {
      const maps = yield* GoogleMapsService
      return yield* maps.querySuggest(req.query)
    }).pipe(Effect.withSpan('getLocationSuggestionHandler'), makeEndpointEffect)
)

export const getGeocodedCoordinatesV2Handler = makeHttpApiHandler(
  LocationApiSpecification,
  'root',
  'getGeocodedCoordinatesV2',
  (req) =>
    Effect.gen(function* () {
      const geocoding = yield* GeocodingService
      return yield* geocoding.queryGeocode(req.query)
    }).pipe(
      Effect.withSpan('getGeocodedCoordinatesV2Handler'),
      makeEndpointEffect
    )
)

export const getLocationSuggestionV2Handler = makeHttpApiHandler(
  LocationApiSpecification,
  'root',
  'getLocationSuggestionV2',
  (req) =>
    Effect.gen(function* () {
      const geocoding = yield* GeocodingService
      return yield* geocoding.querySuggest(req.query)
    }).pipe(
      Effect.withSpan('getLocationSuggestionV2Handler'),
      makeEndpointEffect
    )
)
