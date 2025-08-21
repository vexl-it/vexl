import {PrivateKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {Effect, flow, Schema} from 'effect/index'
import {type ParseError} from 'effect/ParseResult'
import {UnixMillisecondsE} from '../utility/UnixMilliseconds.brand'

export const LoginChallengeRequestPayload = Schema.compose(
  Schema.StringFromBase64,
  Schema.parseJson(
    Schema.Struct({
      privateKey: PrivateKeyPemBase64E,
      challenge: Schema.String,
      validUntil: UnixMillisecondsE,
    })
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
  Schema.encode(LoginChallengeRequestPayload),
  Effect.flatMap(Schema.decode(LoginChallengeRequestEncoded))
)
export const decodeLoginChallengeRequestPayload: (
  encoded: LoginChallengeRequestEncoded
) => Effect.Effect<LoginChallengeRequestPayload, ParseError> = Schema.decode(
  LoginChallengeRequestPayload
)
