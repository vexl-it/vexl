import {Schema} from 'effect'
import {DaysBucket, OffersVisibleBucket} from '../buckets'
import {defineJourney} from '../core'

export const OnboardingStep = Schema.Literal(
  'opened',
  'phoneSubmitted',
  'codeVerified',
  'registered'
)
export type OnboardingStep = typeof OnboardingStep.Type

export const ContactsImportOutcome = Schema.Literal(
  'started',
  'completed',
  'skipped',
  'denied',
  'failed'
)
export type ContactsImportOutcome = typeof ContactsImportOutcome.Type

export const ActivationKind = Schema.Literal('offer', 'request')
export type ActivationKind = typeof ActivationKind.Type

export const ClubJoinTiming = Schema.Literal(
  'beforeContactsImport',
  'afterContactsImport'
)
export type ClubJoinTiming = typeof ClubJoinTiming.Type

export const onboardingJourney = defineJourney({
  name: 'onboarding',
  schemaVersion: 1,
  lifetimeDays: 37,
  updatedDayPrecision: 'week',
  state: Schema.Struct({
    step: OnboardingStep,
    existingAccount: Schema.optional(Schema.Boolean),
    registeredAfter: Schema.optional(DaysBucket),
    contactsImport: Schema.optional(ContactsImportOutcome),
    firstMarketplaceLoad: Schema.optional(OffersVisibleBucket),
    offerOpened: Schema.optional(Schema.Boolean),
    activation: Schema.optional(ActivationKind),
    activatedAfter: Schema.optional(DaysBucket),
    clubJoin: Schema.optional(ClubJoinTiming),
    clubActivation: Schema.optional(ActivationKind),
    coreActionD1: Schema.optional(Schema.Boolean),
    coreActionD7: Schema.optional(Schema.Boolean),
    coreActionD30: Schema.optional(Schema.Boolean),
  }),
  terminalStates: [],
})

export type OnboardingState = typeof onboardingJourney.payloadSchema.Type
