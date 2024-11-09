import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  GetExchangeRateError,
  type GetExchangeRateRequest,
  GetExchangeRateResponse,
} from '@vexl-next/rest-api/src/services/btcExchangeRate/contracts'
import axios from 'axios'
import {Cache, Context, Duration, Effect, Layer, Schema} from 'effect'

const fetchExchangePrice = (
  currency: CurrencyCode
): Effect.Effect<GetExchangeRateResponse, GetExchangeRateError> => {
  return Effect.tryPromise({
    try: async () => {
      return (await axios.get(`https://api.yadio.io/exrates/${currency}`)).data
    },
    catch: () => {
      return new GetExchangeRateError({reason: 'YadioError', status: 400})
    },
  }).pipe(
    Effect.flatMap(Schema.decode(GetExchangeRateResponse)),
    Effect.catchTag('ParseError', (e) =>
      Effect.zipLeft(
        new GetExchangeRateError({reason: 'YadioError', status: 400}),
        Effect.logError('Error while parsing response from Yadio', e)
      )
    ),
    Effect.withSpan('fetchExchangeRate', {attributes: {currency}})
  )
}

const getExchangeRatePrice =
  (
    cache: Cache.Cache<
      CurrencyCode,
      GetExchangeRateResponse,
      GetExchangeRateError
    >
  ) =>
  (
    request: GetExchangeRateRequest
  ): Effect.Effect<GetExchangeRateResponse, GetExchangeRateError> => {
    return Effect.gen(function* (_) {
      return yield* _(
        cache
          .get(request.currency)
          .pipe(Effect.tapErrorCause(() => cache.invalidate(request.currency)))
      )
    }).pipe(
      Effect.withSpan('getExchangeRateFromCache', {
        attributes: {currency: request.currency},
      })
    )
  }

export interface YadioOperations {
  getExchangeRatePrice: ReturnType<typeof getExchangeRatePrice>
}

export class YadioService extends Context.Tag('YadioService')<
  YadioService,
  YadioOperations
>() {
  static readonly Live = Layer.effect(
    YadioService,
    Effect.gen(function* (_) {
      const cache = yield* _(
        Cache.make({
          capacity: Number.MAX_SAFE_INTEGER,
          timeToLive: Duration.minutes(10),
          lookup: fetchExchangePrice,
        })
      )
      return {
        getExchangeRatePrice: getExchangeRatePrice(cache),
      }
    })
  )
}
