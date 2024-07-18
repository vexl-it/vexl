import {Schema} from '@effect/schema'
import {
  GetExchangeRateEndpoint,
  getExchangeRateErrors,
  GetGeocodedCoordinatesEndpoint,
  GetGeocodedCoordinatesErrors,
  GetLocationSuggestionEndpoint,
} from '@vexl-next/rest-api/src/services/location/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {GoogleMapsService} from '../utils/googleMapsApi'
import {YadioService} from '../utils/yadio'

export const getExchangeRateHandler = Handler.make(
  GetExchangeRateEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const yadio = yield* _(YadioService)
        return yield* _(
          yadio.getExchangeRatePrice({currency: req.query.currency})
        )
      }).pipe(
        Effect.withSpan('getExchangeRateHandler', {
          attributes: {currency: req.query.currency},
        })
      ),
      getExchangeRateErrors
    )
)

export const getGeocodedCoordinatesRequest = Handler.make(
  GetGeocodedCoordinatesEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const maps = yield* _(GoogleMapsService)
        return yield* _(maps.queryGeocode(req.query))
      }),
      GetGeocodedCoordinatesErrors
    )
)

export const getLocationSuggestionHandler = Handler.make(
  GetLocationSuggestionEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const maps = yield* _(GoogleMapsService)
        return yield* _(maps.querySuggest(req.query))
      }),
      Schema.Void
    )
)
