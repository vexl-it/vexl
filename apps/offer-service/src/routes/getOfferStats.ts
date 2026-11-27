import {HttpApiBuilder} from '@effect/platform'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {OfferStatsService} from '../utils/offerStats'

export const getOfferStats = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'getOfferStats',
  () =>
    Effect.gen(function* (_) {
      const offerStats = yield* _(OfferStatsService)
      return yield* _(offerStats.getOfferStats)
    }).pipe(Effect.withSpan('getOfferStats'), makeEndpointEffect)
)
