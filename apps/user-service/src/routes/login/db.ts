import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VerificationNotFoundError} from '@vexl-next/rest-api/src/services/user/specification'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Effect} from 'effect'
import {ChallengeVerificationState} from './domain'

const createKey = (phoneNumber: PublicKeyPemBase64): string =>
  `challengeVerification.${phoneNumber}`

export const storeVerifyChallengeRequest = (
  publicKey: PublicKeyPemBase64,
  state: ChallengeVerificationState
): Effect.Effect<void, UnexpectedServerError, RedisService> =>
  RedisService.pipe(
    Effect.flatMap((redis) =>
      redis.set(ChallengeVerificationState)(createKey(publicKey), state, {
        expiresAt: state.expiresAt,
      })
    ),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError(
          'Error while storing challenge verification request',
          e
        ),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )

export const queryVerifyChallengeRequest = (
  publicKey: PublicKeyPemBase64
): Effect.Effect<
  ChallengeVerificationState,
  UnexpectedServerError | VerificationNotFoundError,
  RedisService
> => {
  return RedisService.pipe(
    Effect.flatMap((redis) =>
      redis.get(ChallengeVerificationState)(createKey(publicKey))
    ),
    Effect.catchAll(
      (
        e
      ): Effect.Effect<
        ChallengeVerificationState,
        UnexpectedServerError | VerificationNotFoundError,
        RedisService
      > => {
        if (e._tag === 'RecordDoesNotExistsReddisError') {
          return Effect.fail(
            new VerificationNotFoundError({status: 404, code: '100104'})
          )
        }
        return Effect.zipRight(
          Effect.logError(
            'Error while querying challenge verification request',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      }
    )
  )
}

export const deleteVerifyChallengeRequest = (
  publicKey: PublicKeyPemBase64
): Effect.Effect<void, UnexpectedServerError, RedisService> =>
  RedisService.pipe(
    Effect.flatMap((redis) => redis.delete(createKey(publicKey))),
    Effect.catchTag('RedisError', (e) =>
      Effect.zipRight(
        Effect.logError(
          'Error while deleting challenge verification request',
          e
        ),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
