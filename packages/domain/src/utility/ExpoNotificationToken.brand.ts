import {Schema, String} from 'effect'
import {FcmToken} from './FcmToken.brand'

export const ExpoNotificationToken = Schema.String.pipe(
  Schema.brand('ExpoNotificationToken')
)
export type ExpoNotificationToken = typeof ExpoNotificationToken.Type

export const isExpoNotificationToken = (
  token: unknown
): token is ExpoNotificationToken =>
  String.isString(token) && String.startsWith(token)('ExponentPushToken')

export const ExpoOrFcmNotificationToken = Schema.Union(
  ExpoNotificationToken,
  FcmToken
)
export type ExpoOrFcmNotificationToken = typeof ExpoOrFcmNotificationToken.Type
