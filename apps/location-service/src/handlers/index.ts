import {HttpApiBuilder} from '@effect/platform/index'
import {
  type NotFoundError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  type GetGeocodedCoordinatesRequest,
  type GetGeocodedCoordinatesResponse,
  type GetLocationSuggestionsRequest,
  type GetLocationSuggestionsResponse,
  type LocationNotFoundError,
} from '@vexl-next/rest-api/src/services/location/contracts'
import {LocationApiSpecification} from '@vexl-next/rest-api/src/services/location/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {GeocodingService} from '../geocoding'

// v1 endpoints are still called by app versions older than 26.8.0, so they
// share the v2 handlers
const geocode = (req: {
  readonly urlParams: GetGeocodedCoordinatesRequest
}): Effect.Effect<
  GetGeocodedCoordinatesResponse,
  UnexpectedServerError | NotFoundError | LocationNotFoundError,
  GeocodingService
> =>
  Effect.gen(function* (_) {
    const geocoding = yield* _(GeocodingService)
    return yield* _(geocoding.queryGeocode(req.urlParams))
  }).pipe(Effect.withSpan('getGeocodedCoordinatesHandler'), makeEndpointEffect)

const suggest = (req: {
  readonly urlParams: GetLocationSuggestionsRequest
}): Effect.Effect<
  GetLocationSuggestionsResponse,
  UnexpectedServerError | NotFoundError,
  GeocodingService
> =>
  Effect.gen(function* (_) {
    const geocoding = yield* _(GeocodingService)
    return yield* _(geocoding.querySuggest(req.urlParams))
  }).pipe(Effect.withSpan('getLocationSuggestionHandler'), makeEndpointEffect)

export const getGeocodedCoordinatesHandler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getGeocodedCoordinates',
  geocode
)

export const getLocationSuggestionHandler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getLocationSuggestion',
  suggest
)

export const getGeocodedCoordinatesV2Handler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getGeocodedCoordinatesV2',
  geocode
)

export const getLocationSuggestionV2Handler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getLocationSuggestionV2',
  suggest
)

export const getLocalizedAddressesHandler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getLocalizedAddresses',
  (req) =>
    Effect.gen(function* (_) {
      const geocoding = yield* _(GeocodingService)
      return yield* _(geocoding.queryLocalizedAddresses(req.urlParams))
    }).pipe(Effect.withSpan('getLocalizedAddressesHandler'), makeEndpointEffect)
)
