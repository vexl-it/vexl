import {HttpApiMiddleware} from '@effect/platform'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  UnauthorizedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Context, Schema} from 'effect'
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
  // TODO change to optional
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
