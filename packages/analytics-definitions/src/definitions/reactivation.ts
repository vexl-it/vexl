import {Schema} from 'effect'
import {AfterOpenAction, DormancyBucket, NotificationCategory} from '../buckets'
import {defineJourney} from '../core'

export const ReactivationSource = Schema.Literal(
  ...NotificationCategory.literals,
  'direct'
)
export type ReactivationSource = typeof ReactivationSource.Type

export const reactivationJourney = defineJourney({
  name: 'reactivation',
  schemaVersion: 1,
  lifetimeDays: 7,
  updatedDayPrecision: 'day',
  state: Schema.Struct({
    dormantFor: DormancyBucket,
    openedFrom: ReactivationSource,
    firstAction: Schema.optional(AfterOpenAction),
    coreAction: Schema.optional(Schema.Boolean),
    clubMember: Schema.optional(Schema.Boolean),
  }),
  terminalStates: [],
})

export type ReactivationState = typeof reactivationJourney.payloadSchema.Type
