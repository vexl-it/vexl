import {HttpApiBuilder} from '@effect/platform/index'
import {LocationApiSpecification} from '@vexl-next/rest-api/src/services/location/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {GoogleMapsService} from '../utils/googleMapsApi'

export const getGeocodedCoordinatesHandler = HttpApiBuilder.handler(
  LocationApiSpecification,
  'root',
  'getGeocodedCoordinates',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const maps = yield* _(GoogleMapsService)
        return yield* _(maps.queryGeocode(req.urlParams))
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
        const maps = yield* _(GoogleMapsService)
        return yield* _(maps.querySuggest(req.urlParams))
      })
    )
)
