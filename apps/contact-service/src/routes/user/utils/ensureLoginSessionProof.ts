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
import {Effect, Option, Schema} from 'effect'
import {createHash} from 'node:crypto'

// Proofs are single-use, so the window only bounds how long a used one is
// remembered. Wide, so a phone with a wrong clock can still sign up and restore.
const MAX_PROOF_AGE_MS = 24 * 60 * 60 * 1000
const USED_PROOF_TTL_MS = 2 * MAX_PROOF_AGE_MS

// Keyed by what was signed: ECDSA signatures are malleable, so a modified
// signature over the same message would dodge a key made from the signature.
const usedProofKey = (publicKey: PublicKeyPemBase64, message: string): string =>
  `login-session-proof:${createHash('sha256').update(`${publicKey}:${message}`).digest('hex')}`

interface ProofInput {
  publicKey: PublicKeyPemBase64
  loginSessionId: LoginSessionId
  loginSessionProof: LoginSessionProof | undefined
}

// The reason a proof is not accepted, none once it is accepted and used up.
const useLoginSessionProof = ({
  publicKey,
  loginSessionId,
  loginSessionProof,
}: ProofInput): Effect.Effect<
  Option.Option<string>,
  UnexpectedServerError,
  RedisService
> =>
  Effect.gen(function* () {
    if (loginSessionProof === undefined) return Option.some('missing')

    const {signedAt, signature} = loginSessionProof
    if (Math.abs(unixMillisecondsNow() - signedAt) > MAX_PROOF_AGE_MS)
      return Option.some('stale')

    const message = loginSessionProofMessage({loginSessionId, signedAt})
    const valid = yield* ecdsaVerifyE(publicKey)({
      data: message,
      signature,
    }).pipe(Effect.orElseSucceed(() => false))
    if (!valid) return Option.some('bad signature')

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
    return firstUse ? Option.none() : Option.some('replayed')
  })

/**
 * For requests that set the login session id. Only the holder of the session
 * private key may do that, otherwise copied session headers could log the
 * real device out for good. Without a login session id (older clients) there
 * is nothing to prove.
 */
export const ensureLoginSessionProof = ({
  loginSessionId,
  ...rest
}: Omit<ProofInput, 'loginSessionId'> & {
  loginSessionId: LoginSessionId | undefined
}): Effect.Effect<
  void,
  InvalidLoginSessionProofError | UnexpectedServerError,
  RedisService
> =>
  loginSessionId === undefined
    ? Effect.void
    : Effect.flatMap(
        useLoginSessionProof({loginSessionId, ...rest}),
        Option.match({
          onNone: () => Effect.void,
          onSome: (reason) =>
            Effect.zipRight(
              Effect.logWarning(`Rejected login session proof: ${reason}`),
              Effect.fail(new InvalidLoginSessionProofError())
            ),
        })
      )

/**
 * For requests that keep the login session id: the proof isn't needed, but is
 * used up so it can't be replayed to a request that sets one.
 */
export const useUpLoginSessionProof = (
  input: ProofInput
): Effect.Effect<void, UnexpectedServerError, RedisService> =>
  Effect.asVoid(useLoginSessionProof(input))
