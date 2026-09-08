import {BtcExchangeRateApiSpecification} from '@vexl-next/rest-api/src/services/btcExchangeRate/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect} from 'effect'
import {YadioService} from '../utils/yadio'

export const getExchangeRateHandler = makeHttpApiHandler(
  BtcExchangeRateApiSpecification,
  'root',
  'getExchangeRate',
  ({request, query}) =>
    Effect.gen(function* () {
      const yadio = yield* YadioService
      return yield* yadio.getExchangeRatePrice({currency: query.currency})
    }).pipe(
      Effect.withSpan('getExchangeRateHandler', {
        attributes: {currency: query.currency},
      }),
      makeEndpointEffect
    )
)
