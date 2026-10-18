import {Schema} from 'effect'
import {defineJourney} from '../core'

export const PromptId = Schema.Literal(
  'importContacts',
  'importNewContacts',
  'missingProductCategories',
  'enableNotifications',
  'enableBackgroundRefresh',
  'createOffer'
)
export type PromptId = typeof PromptId.Type

export const PromptOutcome = Schema.Literal('dismissed', 'tapped')
export type PromptOutcome = typeof PromptOutcome.Type

export const promptJourney = defineJourney({
  name: 'prompt',
  schemaVersion: 1,
  lifetimeDays: 7,
  updatedDayPrecision: 'day',
  state: Schema.Struct({
    promptId: PromptId,
    outcome: Schema.optional(PromptOutcome),
    targetReached: Schema.optional(Schema.Boolean),
  }),
  terminalStates: [],
})

export type PromptState = typeof promptJourney.payloadSchema.Type
