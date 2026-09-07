import {
  PublicKeyPemBase64,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Option, Schema} from 'effect'

export const ChallengePayload = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.OptionFromOptionalNullOr(PublicKeyV2).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  expiresAt: UnixMilliseconds,
})
export type ChallengePayload = typeof ChallengePayload.Type
