import {Schema} from '@effect/schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import dotenv from 'dotenv'
import {Effect, Layer} from 'effect'

const EnvironmentData = Schema.Struct({
  GOOGLE_PLACES_API_KEY: Schema.String,
  SIGNATURE_PUBLIC_KEY: PublicKeyPemBase64E,
  PORT: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.positive(),
    Schema.optional({default: () => 3000})
  ),
  HEALT_PORT: Schema.NumberFromString.pipe(
    Schema.int(),
    Schema.positive(),
    Schema.optional({default: () => 3001})
  ),
})

export class Environment extends Effect.Tag('Environment')<
  Environment,
  Schema.Schema.Type<typeof EnvironmentData>
>() {
  static readonly Live = Layer.effect(
    Environment,
    Effect.sync(() => {
      dotenv.config()
    }).pipe(
      Effect.flatMap(() => Schema.decodeUnknown(EnvironmentData)(process.env))
    )
  )
}

export const EnvironmentConstants = Effect.serviceConstants(Environment)
