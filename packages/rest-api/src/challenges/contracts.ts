import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Schema} from 'effect/index'

export const Challenge = Schema.String.pipe(Schema.brand('Challenge'))
export type Challenge = Schema.Schema.Type<typeof Challenge>

export const SignedChallenge = Schema.Struct({
  challenge: Challenge,
  signature: EcdsaSignature,
})
export type SignedChallenge = Schema.Schema.Type<typeof SignedChallenge>

export const RequestBaseWithChallenge = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  signedChallenge: SignedChallenge,
})
export type RequestBaseWithChallenge = typeof RequestBaseWithChallenge.Type

export class InvalidChallengeError extends Schema.TaggedError<InvalidChallengeError>(
  'InvalidChallengeError'
)('InvalidChallengeError', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}

export class ErrorSigningChallenge extends Schema.TaggedError<ErrorSigningChallenge>(
  'ErrorSigningChallenge'
)('ErrorSigningChallenge', {
  status: Schema.optionalWith(Schema.Literal(400), {default: () => 400}),
}) {}
