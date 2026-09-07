import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  GetExchangeRateError,
  type GetExchangeRateRequest,
  type GetExchangeRateResponse,
} from '@vexl-next/rest-api/src/services/btcExchangeRate/contracts'
import axios from 'axios'
import {Cache, Context, Duration, Effect, Layer, Option, Schema} from 'effect'

const YadioResponse = Schema.Struct({
  BTC: Schema.Number,
})

const fetchExchangePrice = (
  currency: CurrencyCode
): Effect.Effect<GetExchangeRateResponse, GetExchangeRateError> => {
  return Effect.tryPromise({
    try: async () => {
      return (await axios.get(`https://api.yadio.io/exrates/${currency}`)).data
    },
    catch: () => {
      return new GetExchangeRateError({reason: 'YadioError', status: 502})
    },
  }).pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(YadioResponse)),
    Effect.map((one) => ({
      BTC: one.BTC,
      lastUpdatedAt: Option.some(unixMillisecondsNow()),
    })),
    Effect.catchTag('SchemaError', (e) =>
      Effect.tap(
        new GetExchangeRateError({reason: 'YadioError', status: 502}),
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
    return Effect.gen(function* () {
      return yield* Cache.get(cache, request.currency).pipe(
        Effect.tapCause(() => Cache.invalidate(cache, request.currency))
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

export class YadioService extends Context.Service<
  YadioService,
  YadioOperations
>()('YadioService') {
  static readonly Live = Layer.effect(
    YadioService,
    Effect.gen(function* () {
      const cache = yield* Cache.make({
        capacity: Number.MAX_SAFE_INTEGER,
        timeToLive: Duration.minutes(10),
        lookup: fetchExchangePrice,
      })
      return {
        getExchangeRatePrice: getExchangeRatePrice(cache),
      }
    })
  )
}
