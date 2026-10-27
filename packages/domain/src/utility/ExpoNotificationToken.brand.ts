import {Schema, String} from 'effect'

export const ExpoNotificationToken = Schema.String.pipe(
  Schema.brand('ExpoNotificationToken')
)
export type ExpoNotificationToken = typeof ExpoNotificationToken.Type

export const isExpoNotificationToken = (
  token: unknown
): token is ExpoNotificationToken =>
  String.isString(token) && String.startsWith('ExponentPushToken')(token)
