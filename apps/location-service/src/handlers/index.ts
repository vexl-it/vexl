import {Schema} from '@effect/schema'
import {
  GetExchangeRateEndpoint,
  GetGeocodedCoordinatesEndpoint,
  GetGeocodedCoordinatesErrors,
  GetLocationSuggestionEndpoint,
} from '@vexl-next/rest-api/src/services/location/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeRedirectHandler} from '@vexl-next/server-utils/src/makeRedirectHandler'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {btcExchangeRateUrlToRedirectToConfig} from '../configs'
import {GoogleMapsService} from '../utils/googleMapsApi'

export const getExchangeRateHandler = makeRedirectHandler(
  GetExchangeRateEndpoint,
  btcExchangeRateUrlToRedirectToConfig
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
