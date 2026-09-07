import {
  PublicKeyPemBase64,
  PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  CryptoBoxCypher,
  CryptoBoxSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Effect, Option, Schema} from 'effect'

export const Challenge = CryptoBoxCypher.pipe(Schema.brand('Challenge'))
export type Challenge = Schema.Schema.Type<typeof Challenge>

export const SignedChallenge = Schema.Struct({
  challenge: Challenge,
  signature: EcdsaSignature,
  signatureV2: Schema.OptionFromOptionalNullOr(CryptoBoxSignature).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type SignedChallenge = Schema.Schema.Type<typeof SignedChallenge>

export const RequestBaseWithChallenge = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.OptionFromOptionalNullOr(PublicKeyV2).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  signedChallenge: SignedChallenge,
})
export type RequestBaseWithChallenge = typeof RequestBaseWithChallenge.Type

export class InvalidChallengeError extends Schema.TaggedError<InvalidChallengeError>(
  'InvalidChallengeError'
)('InvalidChallengeError', {
  status: Schema.Literal(400).pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 400 => 400)),
    Schema.withConstructorDefault(Effect.sync((): 400 => 400))
  ),
}) {}

export class PublicKeyV2MissingError extends Schema.TaggedError<PublicKeyV2MissingError>(
  'PublicKeyV2MissingError'
)('PublicKeyV2MissingError', {}) {}

export class KeyAlreadySetError extends Schema.TaggedError<KeyAlreadySetError>(
  'KeyAlreadySetError'
)('KeyAlreadySetError', {}) {}

export class ErrorSigningChallenge extends Schema.TaggedError<ErrorSigningChallenge>(
  'ErrorSigningChallenge'
)('ErrorSigningChallenge', {
  status: Schema.Literal(400).pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 400 => 400)),
    Schema.withConstructorDefault(Effect.sync((): 400 => 400))
  ),
}) {}

export const CreateChallengeRequest = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.OptionFromOptionalNullOr(PublicKeyV2).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type CreateChallengeRequest = typeof CreateChallengeRequest.Type

export const CreateChallengeResponse = Schema.Struct({
  challenge: Challenge,
  expiration: UnixMilliseconds,
})
export type CreateChallengeResponse = typeof CreateChallengeResponse.Type

export const CreateChallengesRequest = Schema.Struct({
  publicKeys: Schema.Array(PublicKeyPemBase64),
})
export type CreateChallengesRequest = typeof CreateChallengesRequest.Type

export const CreateChallengesResponse = Schema.Struct({
  challenges: Schema.Array(
    Schema.Struct({
      publicKey: PublicKeyPemBase64,
      challenge: Challenge,
    })
  ),
  expiration: UnixMilliseconds,
})
export type CreateChallengesResponse = typeof CreateChallengeResponse.Type
