import {Schema} from '@effect/schema'
import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  GetExchangeRateError,
  GetExchangeRateResponse,
  type GetExchangeRateRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import axios from 'axios'
import {Cache, Context, Duration, Effect, Layer} from 'effect'

type FetchExchangePriceCache = Cache.Cache<
  CurrencyCode,
  GetExchangeRateResponse,
  GetExchangeRateError
>

const fetchExchangePrice = (
  currency: CurrencyCode
): Effect.Effect<GetExchangeRateResponse, GetExchangeRateError> => {
  return Effect.tryPromise({
    try: async () => {
      return (await axios.get(`https://api.yadio.io/exrates/${currency}`)).data
    },
    catch: () => {
      return new GetExchangeRateError({reason: 'YadioError'})
    },
  }).pipe(
    Effect.flatMap(Schema.decode(GetExchangeRateResponse)),
    Effect.catchTag('ParseError', (e) =>
      Effect.zipLeft(
        new GetExchangeRateError({reason: 'YadioError'}),
        Effect.logError('Error while parsing response from Yadio', e)
      )
    )
  )
}

export class YadioCache extends Context.Tag('TagYadioCache')<
  YadioCache,
  FetchExchangePriceCache
>() {
  static layer(): Layer.Layer<YadioCache> {
    return Layer.effect(
      YadioCache,
      Cache.make({
        capacity: Number.MAX_SAFE_INTEGER,
        timeToLive: Duration.minutes(10),
        lookup: fetchExchangePrice,
      })
    )
  }
}

export function getExchangeRatePrice(
  request: GetExchangeRateRequest
): Effect.Effect<GetExchangeRateResponse, GetExchangeRateError, YadioCache> {
  return Effect.gen(function* (_) {
    const cache = yield* _(YadioCache)
    return yield* _(
      cache
        .get(request.currency)
        .pipe(Effect.tapErrorCause(() => cache.invalidate(request.currency)))
    )
  })
}
