import {HttpApiMiddleware} from '@effect/platform'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  UnauthorizedError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {Context, Schema} from 'effect'
import {CommonHeaders} from './commonHeaders'
import {HEADER_HASH, HEADER_PUBLIC_KEY, HEADER_SIGNATURE} from './constants'
import {type GetUserSessionCredentials} from './UserSessionCredentials.brand'

export const SecurityHeaders = Schema.Struct({
  [HEADER_HASH]: HashedPhoneNumberE,
  [HEADER_SIGNATURE]: EcdsaSignature,
  [HEADER_PUBLIC_KEY]: PublicKeyPemBase64E,
})
export type SecurityHeaders = Schema.Schema.Type<typeof SecurityHeaders>

export class CurrentSecurity extends Context.Tag('CurrentSecurity')<
  CurrentSecurity,
  SecurityHeaders
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
  return new CommonAndSecurityHeaders({
    ...commonHeaders,
    [HEADER_PUBLIC_KEY]: getUserSessionCredentials().publicKey,
    [HEADER_SIGNATURE]: Schema.decodeSync(EcdsaSignature)(
      getUserSessionCredentials().signature
    ),
    [HEADER_HASH]: Schema.decodeSync(HashedPhoneNumberE)(
      getUserSessionCredentials().hash
    ),
  })
}
