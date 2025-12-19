import {
  PrivateKeyPemBase64E,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Config, Schema} from 'effect'

export const fcmTokenPublicKeyConfig = Config.string(
  'FCM_TOKEN_PUBLIC_KEY'
).pipe(Config.map(Schema.decodeSync(PublicKeyPemBase64E)))
export const fcmTokenPrivateKeyConfig = Config.string(
  'FCM_TOKEN_PRIVATE_KEY'
).pipe(Config.map(Schema.decodeSync(PrivateKeyPemBase64E)))

export const expoAccessToken = Config.string('EXPO_ACCESS_TOKEN')

export const notificationThrottleTtlMinutesConfig = Config.number(
  'NOTIFICATION_THROTTLE_TTL_MINUTES'
).pipe(Config.withDefault(10))
