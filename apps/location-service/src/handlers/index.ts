import {HttpApiBuilder} from '@effect/platform/index'
import {LocationApiSpecification} from '@vexl-next/rest-api/src/services/location/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {GeocodingService} from '../geocoding'

export const getGeocodedCoordinatesHandler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getGeocodedCoordinates',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const geocoding = yield* _(GeocodingService)
        return yield* _(geocoding.queryGeocode(req.urlParams))
      })
    )
)

export const getLocationSuggestionHandler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getLocationSuggestion',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const geocoding = yield* _(GeocodingService)
        return yield* _(geocoding.querySuggest(req.urlParams))
      })
    )
)
