import {Schema} from 'effect'

export const VexlProductNotificationUuid = Schema.UUID.pipe(
  Schema.brand('VexlProductNotificationUuid')
)
export type VexlProductNotificationUuid =
  typeof VexlProductNotificationUuid.Type

export const VexlProductNotification = Schema.Struct({
  uuid: VexlProductNotificationUuid,
  title: Schema.String,
  description: Schema.String,
  issuePushNotification: Schema.Boolean,
  date: Schema.DateFromString,
  actionLink: Schema.optional(Schema.String),
  actionText: Schema.optional(Schema.String),
  type: Schema.Literal('MARKETING', 'GENERAL'),
})
export type VexlProductNotification = typeof VexlProductNotification.Type
