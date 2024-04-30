import * as S from '@effect/schema/Schema'
import {
  PrivateKeyPemBase64E,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import dotenv from 'dotenv'
import {Effect, Layer} from 'effect'

const EnvironmentData = S.Struct({
  PORT: S.String.pipe(
    S.compose(S.NumberFromString),
    S.int(),
    S.positive(),
    S.optional({default: () => 3000})
  ),

  HEALTH_PORT: S.String.pipe(
    S.compose(S.NumberFromString),
    S.int(),
    S.positive(),
    S.optional({default: () => 3001})
  ),
  FCM_TOKEN_PUBLIC_KEY: PublicKeyPemBase64E,
  FCM_TOKEN_PRIVATE_KEY: PrivateKeyPemBase64E,
  SIGNATURE_PUBLIC_KEY: PublicKeyPemBase64E,
  FIREBASE_CREDENTIALS: S.parseJson({}),
})

export interface EnvironmentData
  extends S.Schema.Type<typeof EnvironmentData> {}

export class Environment extends Effect.Tag('Environment')<
  Environment,
  EnvironmentData
>() {
  static readonly Live = Layer.effect(
    Environment,
    Effect.sync(() => {
      dotenv.config()
    }).pipe(Effect.flatMap(() => S.decodeUnknown(EnvironmentData)(process.env)))
  )
}

export const EnvironmentConstants = Effect.serviceConstants(Environment)
