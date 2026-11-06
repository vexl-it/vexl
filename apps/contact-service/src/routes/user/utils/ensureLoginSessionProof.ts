import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type LoginSessionId} from '@vexl-next/domain/src/general/LoginSessionId.brand'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  unixMillisecondsFromNow,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {ecdsaVerifyE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidLoginSessionProofError,
  loginSessionProofMessage,
  type LoginSessionProof,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Effect, Schema} from 'effect'
import {createHash} from 'node:crypto'

const MAX_PROOF_AGE_MS = 10 * 60 * 1000
// Outlives the freshness window, so a proof can't be used twice.
const USED_PROOF_TTL_MS = 2 * MAX_PROOF_AGE_MS

// Keyed by what was signed: ECDSA signatures are malleable, so a modified
// signature over the same message would dodge a key made from the signature.
const usedProofKey = (publicKey: PublicKeyPemBase64, message: string): string =>
  `login-session-proof:${createHash('sha256').update(`${publicKey}:${message}`).digest('hex')}`

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
}): Effect.Effect<
  void,
  InvalidLoginSessionProofError | UnexpectedServerError,
  RedisService
> =>
  Effect.gen(function* () {
    if (loginSessionId === undefined) return
    if (loginSessionProof === undefined) return yield* reject('missing')

    const {signedAt, signature} = loginSessionProof
    if (Math.abs(unixMillisecondsNow() - signedAt) > MAX_PROOF_AGE_MS)
      return yield* reject('stale')

    const message = loginSessionProofMessage({loginSessionId, signedAt})
    const valid = yield* ecdsaVerifyE(publicKey)({
      data: message,
      signature,
    }).pipe(Effect.orElseSucceed(() => false))
    if (!valid) return yield* reject('bad signature')

    const redis = yield* RedisService
    const firstUse = yield* redis
      .setIfNotExists(Schema.Literal(true))(
        usedProofKey(publicKey, message),
        true,
        {expiresAt: unixMillisecondsFromNow(USED_PROOF_TTL_MS)}
      )
      .pipe(
        // Without the cause: it could carry the key.
        Effect.mapError(
          () =>
            new UnexpectedServerError({
              status: 500,
              message: 'Unable to claim login session proof',
            })
        )
      )
    if (!firstUse) return yield* reject('replayed')
  })
