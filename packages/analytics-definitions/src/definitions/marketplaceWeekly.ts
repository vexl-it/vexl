import {Schema} from 'effect'
import {cappedCounter, OffersVisibleBucket} from '../buckets'
import {defineAggregation} from '../core'

export const FirstLoadResult = Schema.Literal('offers', 'empty', 'notLoaded')
export type FirstLoadResult = typeof FirstLoadResult.Type

export const marketplaceWeeklyAggregation = defineAggregation({
  name: 'marketplaceWeekly',
  schemaVersion: 1,
  period: 'week',
  state: Schema.Struct({
    marketplaceOpened: cappedCounter(50),
    firstLoadResult: FirstLoadResult,
    offersVisibleBucket: Schema.optional(OffersVisibleBucket),
  }),
})

export type MarketplaceWeeklyState =
  typeof marketplaceWeeklyAggregation.payloadSchema.Type
