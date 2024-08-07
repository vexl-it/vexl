import * as S from '@effect/schema/Schema'
import {
  PrivateKeyPemBase64E,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Effect, Layer} from 'effect'

const EnvironmentData = S.Struct({
  PORT: S.String.pipe(
    S.compose(S.NumberFromString),
    S.int(),
    S.positive(),
    S.optionalWith({default: () => 3000})
  ),

  HEALTH_PORT: S.String.pipe(
    S.compose(S.NumberFromString),
    S.int(),
    S.positive(),
    S.optionalWith({default: () => 3001})
  ),
  ENV: S.compose(S.String, S.Literal('development', 'production')).pipe(
    S.optionalWith({default: () => 'production' as const})
  ),
  FCM_TOKEN_PUBLIC_KEY: PublicKeyPemBase64E,
  FCM_TOKEN_PRIVATE_KEY: PrivateKeyPemBase64E,
  SIGNATURE_PUBLIC_KEY: PublicKeyPemBase64E,
  FIREBASE_CREDENTIALS: S.parseJson({}),
  IOS_APP_BUNDLE_ID: S.String.pipe(
    S.optionalWith({default: () => 'it.vexl.nextstaging'})
  ),
})

export interface EnvironmentData
  extends S.Schema.Type<typeof EnvironmentData> {}

export class Environment extends Effect.Tag('Environment')<
  Environment,
  EnvironmentData
>() {
  static readonly Live = Layer.effect(
    Environment,
    S.decodeUnknown(EnvironmentData)(process.env)
  )
}

export const EnvironmentConstants = Effect.serviceConstants(Environment)
