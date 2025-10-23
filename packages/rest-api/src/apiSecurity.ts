import {HttpApiMiddleware} from '@effect/platform'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnauthorizedError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Context, Schema} from 'effect'

export const SecurityHeaders = Schema.Struct({
  hash: HashedPhoneNumberE,
  signature: EcdsaSignature,
  'public-key': PublicKeyPemBase64E,
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
    failure: UnauthorizedError,
  }
) {}
