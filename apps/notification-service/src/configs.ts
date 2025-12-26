import {
  PrivateKeyPemBase64,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Config, Schema} from 'effect'

export const fcmTokenPublicKeyConfig = Config.string(
  'FCM_TOKEN_PUBLIC_KEY'
).pipe(Config.map(Schema.decodeSync(PublicKeyPemBase64)))
export const fcmTokenPrivateKeyConfig = Config.string(
  'FCM_TOKEN_PRIVATE_KEY'
).pipe(Config.map(Schema.decodeSync(PrivateKeyPemBase64)))

export const expoAccessToken = Config.string('EXPO_ACCESS_TOKEN')

export const notificationThrottleTtlMinutesConfig = Config.number(
  'NOTIFICATION_THROTTLE_TTL_MINUTES'
).pipe(Config.withDefault(10))
