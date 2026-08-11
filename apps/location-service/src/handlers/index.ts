import {HttpApiBuilder} from '@effect/platform/index'
import {LocationApiSpecification} from '@vexl-next/rest-api/src/services/location/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {PlacesService} from '../places'

export const getGeocodedCoordinatesHandler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getGeocodedCoordinates',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const places = yield* _(PlacesService)
        return yield* _(places.queryGeocode(req.urlParams))
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
        const places = yield* _(PlacesService)
        return yield* _(places.querySuggest(req.urlParams))
      })
    )
)
