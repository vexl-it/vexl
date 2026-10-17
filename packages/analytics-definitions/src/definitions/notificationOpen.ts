import {Schema} from 'effect'
import {NotificationCategory} from '../buckets'
import {defineJourney} from '../core'

export const notificationOpenJourney = defineJourney({
  name: 'notificationOpen',
  schemaVersion: 1,
  lifetimeDays: 1,
  updatedDayPrecision: 'day',
  state: Schema.Struct({
    category: NotificationCategory,
    offerOpened: Schema.optional(Schema.Boolean),
    offerCreated: Schema.optional(Schema.Boolean),
    requestSent: Schema.optional(Schema.Boolean),
    chatOpened: Schema.optional(Schema.Boolean),
  }),
  terminalStates: [],
})

export type NotificationOpenState =
  typeof notificationOpenJourney.payloadSchema.Type
