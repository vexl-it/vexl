import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {ecdsaVerifyE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidLoginSessionProofError,
  loginSessionProofMessage,
  type LoginSessionProof,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Effect} from 'effect'

const MAX_PROOF_AGE_MS = 10 * 60 * 1000

const reject = (
  reason: string
): Effect.Effect<never, InvalidLoginSessionProofError> =>
  Effect.zipRight(
    Effect.logWarning(`Rejected login session proof: ${reason}`),
    Effect.fail(new InvalidLoginSessionProofError())
  )

/**
 * Only the holder of the session private key may set the login session id,
 * otherwise copied session headers could log the real device out for good.
 * Clients that don't send a login session id keep working without a proof.
 */
export const ensureLoginSessionProof = ({
  publicKey,
  loginSessionId,
  loginSessionProof,
}: {
  publicKey: PublicKeyPemBase64
  loginSessionId: LoginSessionId | undefined
  loginSessionProof: LoginSessionProof | undefined
}): Effect.Effect<void, InvalidLoginSessionProofError> =>
  Effect.gen(function* () {
    if (loginSessionId === undefined) return
    if (loginSessionProof === undefined) return yield* reject('missing')

    const {signedAt, signature} = loginSessionProof
    if (Math.abs(unixMillisecondsNow() - signedAt) > MAX_PROOF_AGE_MS)
      return yield* reject('stale')

    const valid = yield* ecdsaVerifyE(publicKey)({
      data: loginSessionProofMessage({loginSessionId, signedAt}),
      signature,
    }).pipe(Effect.orElseSucceed(() => false))
    if (!valid) return yield* reject('bad signature')
  })
