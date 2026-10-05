import {Schema} from 'effect'
import {DurationBucket} from '../buckets'
import {defineJourney} from '../core'

export const OnboardingStep = Schema.Literal(
  'opened',
  'intro',
  'phoneSubmitted',
  'codeVerified',
  'registered',
  'contactsImport',
  'notifications',
  'onboardingFinished'
)
export type OnboardingStep = typeof OnboardingStep.Type

export const ContactsImportOutcome = Schema.Literal(
  'success',
  'zero',
  'skipped',
  'denied',
  'error'
)
export type ContactsImportOutcome = typeof ContactsImportOutcome.Type

export const NotificationsOutcome = Schema.Literal('granted', 'skipped')
export type NotificationsOutcome = typeof NotificationsOutcome.Type

export const onboardingJourney = defineJourney({
  name: 'onboarding',
  schemaVersion: 1,
  lifetimeDays: 7,
  updatedDayPrecision: 'day',
  state: Schema.Struct({
    step: OnboardingStep,
    reLogin: Schema.optional(Schema.Boolean),
    contactsImport: Schema.optional(ContactsImportOutcome),
    notifications: Schema.optional(NotificationsOutcome),
    openToRegistration: Schema.optional(DurationBucket),
  }),
  terminalStates: ['onboardingFinished'],
})

export type OnboardingState = typeof onboardingJourney.payloadSchema.Type
