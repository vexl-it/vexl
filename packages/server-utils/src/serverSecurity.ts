import {HttpServerRequest} from '@effect/platform'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UnauthorizedError} from '@vexl-next/domain/src/general/commonErrors'
import {type EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {
  UserDataShape,
  type VexlAuthHeader,
} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {
  type AuthenticatedUserInfo,
  SecurityHeaders,
  ServerSecurityMiddleware,
} from '@vexl-next/rest-api/src/apiSecurity'
import {Effect, Layer, Option, Schema} from 'effect/index'
import {ServerCrypto} from './ServerCrypto'
import {makeMiddlewareEffect} from './makeMiddlewareEffect'

export const verifyVexlAuthHeader = (
  vexlAuthHeader: VexlAuthHeader
): Effect.Effect<VexlAuthHeader, UnauthorizedError, ServerCrypto> =>
  Effect.gen(function* (_) {
    const userDataEncoded = yield* _(
      Schema.encode(UserDataShape)(vexlAuthHeader.data),
      Effect.mapError(
        (e) =>
          new UnauthorizedError({
            cause: new Error('Invalid VexlAuth header'),
            status: 401,
          })
      )
    )
    const signature = vexlAuthHeader.signature

    const crypto = yield* _(ServerCrypto)
    const isValid = yield* _(
      crypto.cryptoBoxVerifySignature(userDataEncoded, signature),
      Effect.mapError(
        (e) =>
          new UnauthorizedError({
            cause: new Error('Invalid VexlAuth header'),
            status: 401,
          })
      )
    )

    if (!isValid) {
      return yield* _(
        Effect.fail(
          new UnauthorizedError({
            cause: new Error('Invalid VexlAuth header'),
            status: 401,
          })
        )
      )
    }

    return vexlAuthHeader
  })

export const verifyOldAuthHeaders = ({
  publicKey,
  hash,
  signature,
}: {
  publicKey: PublicKeyPemBase64
  hash: HashedPhoneNumber
  signature: EcdsaSignature
}): Effect.Effect<
  {
    publicKey: PublicKeyPemBase64
    hash: HashedPhoneNumber
    signature: EcdsaSignature
  },
  UnauthorizedError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const challenge = `${publicKey}${hash}`

    const crypto = yield* _(ServerCrypto)
    const valid = yield* _(
      crypto.verifyEcdsa({data: challenge, signature}),
      Effect.catchAll((error) =>
        Effect.zipRight(
          Effect.logWarning('Error while checking security', error),
          Effect.fail(
            new UnauthorizedError({
              cause: new Error('Invalid auth headers'),
              status: 401,
            })
          )
        )
      )
    )

    if (!valid) {
      yield* _(Effect.log('Invalid ecdsa signature in security headers'))
      return yield* _(
        Effect.fail(
          new UnauthorizedError({
            cause: new Error('Invalid auth headers'),
            status: 401,
          })
        )
      )
    }
    return {publicKey, hash, signature}
  })

export const verifyUserSecurity = ({
  hash,
  publicKey,
  signature,
  vexlAuthHeader,
}: {
  hash: HashedPhoneNumber
  signature: EcdsaSignature
  publicKey: PublicKeyPemBase64
  vexlAuthHeader?: VexlAuthHeader
}): Effect.Effect<AuthenticatedUserInfo, UnauthorizedError, ServerCrypto> =>
  Effect.gen(function* (_) {
    yield* verifyOldAuthHeaders({
      publicKey,
      hash,
      signature,
    })

    if (!vexlAuthHeader) {
      return {
        hash,
        publicKey,
        publicKeyV2: Option.none(),
      }
    }

    if (hash !== vexlAuthHeader.data.hash) {
      yield* _(
        Effect.log(
          'Hash in VexlAuth header does not match hash in security headers'
        )
      )
      return yield* _(
        Effect.fail(
          new UnauthorizedError({
            cause: new Error('Invalid auth headers'),
            status: 401,
          })
        )
      )
    }

    yield* _(verifyVexlAuthHeader(vexlAuthHeader))

    return {
      hash,
      publicKey,
      publicKeyV2: Option.some(vexlAuthHeader.data.pk),
    }
  })

export const ServerSecurityMiddlewareLive = Layer.effect(
  ServerSecurityMiddleware,
  Effect.gen(function* (_) {
    const crypto = yield* _(ServerCrypto)
    return Effect.gen(function* (_) {
      const securityHeaders = yield* _(
        HttpServerRequest.schemaHeaders(SecurityHeaders),
        Effect.mapError(
          () =>
            new UnauthorizedError({
              cause: new Error('Missing required headers'),
              status: 401,
            })
        )
      )

      return yield* verifyUserSecurity({
        hash: securityHeaders.hash,
        publicKey: securityHeaders['public-key'],
        signature: securityHeaders.signature,
        vexlAuthHeader: securityHeaders.authorization,
      })
    }).pipe(
      Effect.provideService(ServerCrypto, crypto),
      makeMiddlewareEffect(UnauthorizedError)
    )
  })
)
