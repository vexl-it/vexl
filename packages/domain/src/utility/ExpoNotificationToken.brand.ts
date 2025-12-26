import {Schema} from 'effect'
import {FcmToken} from './FcmToken.brand'

export const ExpoNotificationToken = Schema.String.pipe(
  Schema.brand('ExpoNotificationToken')
)
export type ExpoNotificationToken = typeof ExpoNotificationToken.Type

export const ExpoOrFcmNotificationToken = Schema.Union(
  ExpoNotificationToken,
  FcmToken
)
export type ExpoOrFcmNotificationToken = typeof ExpoOrFcmNotificationToken.Type
