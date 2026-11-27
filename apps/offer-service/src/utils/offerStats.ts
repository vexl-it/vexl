import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type OfferStatsResponse} from '@vexl-next/rest-api/src/services/offer/offerStats'
import {Cache, Context, Duration, Effect, Layer} from 'effect'
import {OfferDbService} from '../db/OfferDbService'

const OFFER_STATS_CACHE_KEY = 'activeOffersPerCountry'

export interface OfferStatsOperations {
  getOfferStats: Effect.Effect<OfferStatsResponse, UnexpectedServerError>
}

export class OfferStatsService extends Context.Tag('OfferStatsService')<
  OfferStatsService,
  OfferStatsOperations
>() {
  static readonly Live = Layer.effect(
    OfferStatsService,
    Effect.gen(function* (_) {
      const offerDb = yield* _(OfferDbService)
      const cache = yield* _(
        Cache.make({
          capacity: 1,
          timeToLive: Duration.days(1),
          lookup: (_key: typeof OFFER_STATS_CACHE_KEY) =>
            offerDb.queryActiveOffersPerCountry(),
        })
      )

      return {
        getOfferStats: cache.get(OFFER_STATS_CACHE_KEY).pipe(
          Effect.tapErrorCause(() => cache.invalidate(OFFER_STATS_CACHE_KEY)),
          Effect.withSpan('getOfferStatsFromCache')
        ),
      }
    })
  )
}
