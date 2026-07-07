import {HttpApiMiddleware} from '@effect/platform'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  UnauthorizedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Context, Effect, Schema} from 'effect'
import {CommonHeaders} from './commonHeaders'
import {
  HEADER_AUTHORIZATION,
  HEADER_HASH,
  HEADER_PUBLIC_KEY,
  HEADER_SIGNATURE,
} from './constants'
import {type GetUserSessionCredentials} from './UserSessionCredentials.brand'
import {VexlAuthHeader} from './VexlAuthHeader'

export const SecurityHeaders = Schema.Struct({
  [HEADER_HASH]: HashedPhoneNumber,
  [HEADER_SIGNATURE]: EcdsaSignature,
  [HEADER_PUBLIC_KEY]: PublicKeyPemBase64,
  [HEADER_AUTHORIZATION]: Schema.UndefinedOr(VexlAuthHeader),
})

export type SecurityHeaders = typeof SecurityHeaders.Type

const AuthenticatedUserInfo = Schema.Struct({
  hash: HashedPhoneNumber,
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.optionalWith(PublicKeyV2, {as: 'Option'}),
})
export type AuthenticatedUserInfo = typeof AuthenticatedUserInfo.Type

export class CurrentSecurity extends Context.Tag('CurrentSecurity')<
  CurrentSecurity,
  AuthenticatedUserInfo
>() {}

export class ServerSecurityMiddleware extends HttpApiMiddleware.Tag<ServerSecurityMiddleware>()(
  'ServerSecurityMiddleware',
  {
    optional: false,
    provides: CurrentSecurity,
    failure: Schema.Union(UnauthorizedError, UnexpectedServerError),
  }
) {}

export class CommonAndSecurityHeaders extends CommonHeaders.extend<CommonAndSecurityHeaders>(
  'CommonAndSecurityHeaders'
)(SecurityHeaders) {}

export const makeCommonAndSecurityHeaders = (
  getUserSessionCredentials: GetUserSessionCredentials,
  commonHeaders: CommonHeaders
): typeof CommonAndSecurityHeaders.Type => {
  const credentials = getUserSessionCredentials()
  return new CommonAndSecurityHeaders({
    ...commonHeaders,
    [HEADER_PUBLIC_KEY]: credentials.publicKey,
    [HEADER_SIGNATURE]: credentials.signature,
    [HEADER_HASH]: credentials.hash,
    [HEADER_AUTHORIZATION]: credentials.vexlAuthHeader,
  })
}

/**
 * Creates a helper that builds an authenticated request with the security
 * headers evaluated lazily - when the returned effect runs (once per request),
 * never while the request is being constructed. Every request therefore reads
 * the current session credentials, and a throwing `getUserSessionCredentials`
 * (see the mobile app's SessionNotReadyError tripwire) surfaces as a defect
 * inside the returned effect instead of a synchronous exception in whatever
 * code builds the request.
 */
export const makeRequestWithCommonAndSecurityHeaders =
  (
    getUserSessionCredentials: GetUserSessionCredentials,
    commonHeaders: CommonHeaders
  ) =>
  <A, E, R>(
    makeRequest: (
      headers: typeof CommonAndSecurityHeaders.Type
    ) => Effect.Effect<A, E, R>
  ): Effect.Effect<A, E, R> =>
    Effect.suspend(() =>
      makeRequest(
        makeCommonAndSecurityHeaders(getUserSessionCredentials, commonHeaders)
      )
    )
