import {Schema} from 'effect'
import {DurationBucket, RequestCountBucket} from '../buckets'
import {defineJourney} from '../core'
import {OfferClass} from '../coreAction'

export const TradeSide = Schema.Literal('buy', 'sell')
export type TradeSide = typeof TradeSide.Type

export const offerJourney = defineJourney({
  name: 'offer',
  schemaVersion: 1,
  lifetimeDays: 30,
  updatedDayPrecision: 'week',
  state: Schema.Struct({
    offerType: TradeSide,
    class: OfferClass,
    firstRequestAfter: Schema.optional(DurationBucket),
    requestsReceived: Schema.optional(RequestCountBucket),
    firstAnswerAfter: Schema.optional(DurationBucket),
    removed: Schema.optional(Schema.Boolean),
  }),
  terminalStates: [],
})

export type OfferState = typeof offerJourney.payloadSchema.Type
