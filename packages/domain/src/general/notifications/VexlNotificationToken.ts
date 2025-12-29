import {Schema} from 'effect/index'

export const VexlNotificationToken = Schema.String.pipe(
  Schema.brand('VexlNotificatioToken')
)
export type VexlNotificaitionToken = typeof VexlNotificationToken.Type

export const VexlNotificationTokenSecret = Schema.String.pipe(
  Schema.brand('VexlNotificationTokenSecret')
)
export type VexlNotificationTokenSecret =
  typeof VexlNotificationTokenSecret.Type
