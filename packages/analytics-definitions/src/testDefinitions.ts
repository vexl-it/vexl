import {Schema} from 'effect'
import {cappedCounter, OffersVisibleBucket} from './buckets'
import {defineAggregation, defineJourney} from './core'
import {type RegisteredAnalyticsDefinition} from './definitions'

export const testJourney = defineJourney({
  name: 'testJourney',
  schemaVersion: 1,
  lifetimeDays: 7,
  updatedDayPrecision: 'day',
  state: Schema.Struct({
    step: Schema.Literal(
      'opened',
      'intro',
      'phoneSubmitted',
      'registered',
      'finished'
    ),
    reLogin: Schema.optional(Schema.Boolean),
  }),
  terminalStates: ['finished'],
})

export const testWeekJourney = defineJourney({
  name: 'testWeekJourney',
  schemaVersion: 1,
  lifetimeDays: 31,
  updatedDayPrecision: 'week',
  state: Schema.Struct({
    activatedBy: Schema.optional(Schema.Literal('offer', 'request')),
    activationClass: Schema.optional(Schema.Literal('main', 'club')),
  }),
  terminalStates: [],
})

export const testAggregation = defineAggregation({
  name: 'testAggregation',
  schemaVersion: 1,
  period: 'week',
  state: Schema.Struct({
    marketplaceOpened: cappedCounter(50),
    firstLoadResult: Schema.Literal('offers', 'empty', 'notLoaded'),
    offersVisibleBucket: Schema.optional(OffersVisibleBucket),
  }),
})

export type TestAggregationState = typeof testAggregation.payloadSchema.Type

/** Stands in for `definitions/index.ts` in tests (mock that module with this one). */
export const analyticsDefinitions: Record<
  string,
  RegisteredAnalyticsDefinition
> = {
  testJourney,
  testWeekJourney,
  testAggregation,
}
