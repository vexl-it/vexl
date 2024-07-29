import {
  GetExchangeRateEndpoint,
  getExchangeRateErrors,
} from '@vexl-next/rest-api/src/services/btcExchangeRate/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
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
