import {PrivateKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, flow, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'

export const LoginChallengeRequestPayload = Schema.StringFromBase64.pipe(
  Schema.decodeTo(
    Schema.fromJsonString(
      Schema.Struct({
        privateKey: PrivateKeyPemBase64,
        challenge: Schema.String,
        validUntil: UnixMilliseconds,
      })
    )
  )
)

export class InvalidLoginSignatureError extends Schema.TaggedError<InvalidLoginSignatureError>(
  'InvalidLoginSignatureError'
)('InvalidLoginSignatureError', {
  status: Schema.Literal(400),
}) {}

export type LoginChallengeRequestPayload =
  typeof LoginChallengeRequestPayload.Type

export const LoginChallengeServerSignature = Schema.String.pipe(
  Schema.brand('LoginChallengeServerSignature')
)
export type LoginChallengeServerSignature =
  typeof LoginChallengeServerSignature.Type

export const LoginChallengeClientSignature = Schema.String.pipe(
  Schema.brand('LoginChallengeClientSignature')
)
export type LoginChallengeClientSignature =
  typeof LoginChallengeClientSignature.Type

export const LoginChallengeRequestEncoded = Schema.String.pipe(
  Schema.brand('LoginChallengeRequestEncoded')
)
export type LoginChallengeRequestEncoded =
  typeof LoginChallengeRequestEncoded.Type

export const encodeLoginChallengeRequestPayload = flow(
  Schema.encodeEffect(LoginChallengeRequestPayload),
  Effect.flatMap(Schema.decodeEffect(LoginChallengeRequestEncoded))
)
export const decodeLoginChallengeRequestPayload: (
  encoded: LoginChallengeRequestEncoded
) => Effect.Effect<LoginChallengeRequestPayload, SchemaError> =
  Schema.decodeEffect(LoginChallengeRequestPayload)
