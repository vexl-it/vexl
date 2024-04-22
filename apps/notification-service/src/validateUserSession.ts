import * as Http from '@effect/platform/HttpServer'
import {Schema} from '@effect/schema'
import * as S from '@effect/schema/Schema'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {ecdsaVerify} from '@vexl-next/cryptography/src/operations/ecdsa'
import {
  HEADER_HASH,
  HEADER_PUBLIC_KEY,
  HEADER_SIGNATURE,
} from '@vexl-next/rest-api/src/constants'
import {Context, Effect, Layer} from 'effect'
import {EnvironmentConstants, type Environment} from './EnvironmentLayer'

export class InvalidSessionError extends S.TaggedError<InvalidSessionError>()(
  'InvalidSessionError',
  {
    message: S.String,
  }
) {}

const AuthHeaders = S.Struct({
  [HEADER_PUBLIC_KEY]: PublicKeyPemBase64E,
  [HEADER_HASH]: S.String,
  [HEADER_SIGNATURE]: S.String,
})

export class UserSessionOnBE extends Schema.TaggedClass<UserSessionOnBE>()(
  'UserSessionOnBE',
  {
    validatedHeaders: AuthHeaders,
  }
) {}

export class RequestUserSession extends Context.Tag('UserSessionLayer')<
  RequestUserSession,
  UserSessionOnBE
>() {}

export const validateUserSession: Effect.Effect<
  UserSessionOnBE,
  InvalidSessionError,
  Environment | Http.request.ServerRequest
> = Effect.gen(function* (_) {
  const headers = yield* _(
    Http.request.schemaHeaders(AuthHeaders),
    Effect.mapError(
      (e) => new InvalidSessionError({message: 'Missing required headers'})
    )
  )

  const challenge = `${headers[HEADER_PUBLIC_KEY]}${headers[HEADER_HASH]}`

  const secretKey = yield* _(EnvironmentConstants.SECRET_KEY)

  const valid = yield* _(
    Effect.try({
      try: () =>
        ecdsaVerify({
          challenge,
          signature: headers[HEADER_SIGNATURE],
          pubKey: secretKey,
        }),
      catch: () =>
        new InvalidSessionError({message: 'Error while validating session'}),
    })
  )

  if (!valid) {
    return yield* _(new InvalidSessionError({message: 'Invalid session'}))
  }

  return new UserSessionOnBE({validatedHeaders: headers})
})

export const AuthenticatedSessionInRequestLive = Layer.effect(
  RequestUserSession,
  validateUserSession
)
