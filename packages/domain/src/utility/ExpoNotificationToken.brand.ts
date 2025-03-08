import {Brand, Schema} from 'effect'
import {z} from 'zod'
import {FcmToken, FcmTokenE} from './FcmToken.brand'

export const ExpoNotificationToken = z
  .string()
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'ExpoNotificationToken'>>()(v)
  )
export const ExpoNotificationTokenE = Schema.String.pipe(
  Schema.brand('ExpoNotificationToken')
)

export type ExpoNotificationToken = Schema.Schema.Type<
  typeof ExpoNotificationTokenE
>

export const ExpoOrFcmNotificationToken = z.union([
  ExpoNotificationToken,
  FcmToken,
])
export const ExpoOrFcmNotificationTokenE = Schema.Union(
  ExpoNotificationTokenE,
  FcmTokenE
)
export type ExpoOrFcmNotificationToken = typeof ExpoOrFcmNotificationTokenE.Type
