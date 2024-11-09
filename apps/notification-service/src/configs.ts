import {
  PrivateKeyPemBase64E,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Config, Effect, Schema} from 'effect'

export const fcmTokenPublicKeyConfig = Config.string(
  'FCM_TOKEN_PUBLIC_KEY'
).pipe(Config.map(Schema.decodeSync(PublicKeyPemBase64E)))
export const fcmTokenPrivateKeyConfig = Config.string(
  'FCM_TOKEN_PRIVATE_KEY'
).pipe(Config.map(Schema.decodeSync(PrivateKeyPemBase64E)))

export const firebaseCredentialsConfig = Config.string(
  'FIREBASE_CREDENTIALS'
).pipe(Effect.flatMap(Schema.decode(Schema.parseJson())))
