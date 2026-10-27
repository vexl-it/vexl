import {Schema} from 'effect'
import {DurationBucket} from '../buckets'
import {defineJourney} from '../core'
import {RequestClass} from '../coreAction'

export const RequestOutcome = Schema.Literal(
  'approved',
  'rejected',
  'cancelled'
)
export type RequestOutcome = typeof RequestOutcome.Type

export const requestJourney = defineJourney({
  name: 'request',
  schemaVersion: 1,
  lifetimeDays: 14,
  updatedDayPrecision: 'week',
  state: Schema.Struct({
    class: RequestClass,
    outcome: Schema.optional(RequestOutcome),
    answerAfter: Schema.optional(DurationBucket),
    bothWrote: Schema.optional(Schema.Boolean),
  }),
  terminalStates: [],
})

export type RequestState = typeof requestJourney.payloadSchema.Type
