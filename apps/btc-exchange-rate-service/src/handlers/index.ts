import {HttpApiBuilder} from '@effect/platform/index'
import {BtcExchangeRateApiSpecification} from '@vexl-next/rest-api/src/services/btcExchangeRate/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {YadioService} from '../utils/yadio'

export const getExchangeRateHandler = HttpApiBuilder.handler(
  BtcExchangeRateApiSpecification,
  'root',
  'getExchangeRate',
  ({request, urlParams}) =>
    Effect.gen(function* (_) {
      const yadio = yield* _(YadioService)
      return yield* _(
        yadio.getExchangeRatePrice({currency: urlParams.currency})
      )
    }).pipe(
      Effect.withSpan('getExchangeRateHandler', {
        attributes: {currency: urlParams.currency},
      }),
      makeEndpointEffect
    )
)
