import {type LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  ecdsaSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  loginSessionProofMessage,
  type LoginSessionProof,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect} from 'effect'
import {type SessionV2} from '../../brands/Session.brand'

/**
 * The login session id with a fresh proof that this device holds the session
 * private key, for every request that sets it on contact-service.
 */
export const loginSessionWithProof = (
  session: Pick<SessionV2, 'loginSessionId' | 'privateKey'>
): Effect.Effect<
  {loginSessionId: LoginSessionId; loginSessionProof: LoginSessionProof},
  CryptoError
> =>
  // Signed when run, so a retried request carries a new proof: contact-service
  // accepts each one only once.
  Effect.suspend(() => {
    const signedAt = unixMillisecondsNow()
    return ecdsaSignE(session.privateKey.privateKeyPemBase64)(
      loginSessionProofMessage({
        loginSessionId: session.loginSessionId,
        signedAt,
      })
    ).pipe(
      Effect.map((signature) => ({
        loginSessionId: session.loginSessionId,
        loginSessionProof: {signedAt, signature},
      }))
    )
  })
