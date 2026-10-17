import {Schema} from 'effect'
import {DaysBucket} from '../buckets'
import {defineJourney} from '../core'

export const ActivatedBy = Schema.Literal('offer', 'request')
export type ActivatedBy = typeof ActivatedBy.Type

export const ActivationClass = Schema.Literal('main', 'both', 'club')
export type ActivationClass = typeof ActivationClass.Type

export const registrationCohortJourney = defineJourney({
  name: 'registrationCohort',
  schemaVersion: 1,
  lifetimeDays: 31,
  updatedDayPrecision: 'week',
  state: Schema.Struct({
    activatedBy: Schema.optional(ActivatedBy),
    activationClass: Schema.optional(ActivationClass),
    registrationToActivation: Schema.optional(DaysBucket),
    d1: Schema.optional(Schema.Boolean),
    d7: Schema.optional(Schema.Boolean),
    d30: Schema.optional(Schema.Boolean),
  }),
  terminalStates: [],
})

export type RegistrationCohortState =
  typeof registrationCohortJourney.payloadSchema.Type
