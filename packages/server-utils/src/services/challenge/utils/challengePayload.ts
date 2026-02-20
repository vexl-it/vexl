import {
  PublicKeyPemBase64,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect/index'

export const ChallengePayload = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.optionalWith(PublicKeyV2, {nullable: true, as: 'Option'}),
  expiresAt: UnixMilliseconds,
})
export type ChallengePayload = typeof ChallengePayload.Type
