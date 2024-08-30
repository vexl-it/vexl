import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {unixMillisecondsFromNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  VerificationNotFoundError,
  type PhoneNumberVerificationId,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {RedisService} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer} from 'effect'
import {VERIFICATION_EXPIRES_AFTER_MILIS} from '../constants'
import {ChallengeVerificationState, PhoneVerificationState} from '../domain'

const PHONE_VERIFICATION_STATE_PREFIX = 'phoneVerificationState:'
const CHALLENGE_VERIFICATION_STATE_PREFIX = 'challengeVerificationState:'

interface VerificationStateDbOperations {
  storePhoneVerificationState: (
    state: PhoneVerificationState
  ) => Effect.Effect<void, UnexpectedServerError>
  retrievePhoneVerificationState: (
    id: PhoneNumberVerificationId
  ) => Effect.Effect<
    PhoneVerificationState,
    VerificationNotFoundError | UnexpectedServerError
  >
  deletePhoneVerificationState: (
    state: PhoneNumberVerificationId
  ) => Effect.Effect<void, UnexpectedServerError>

  storeChallengeVerificationState: (
    state: ChallengeVerificationState
  ) => Effect.Effect<void, UnexpectedServerError>
  retrieveChallengeVerificationState: (
    id: PublicKeyPemBase64
  ) => Effect.Effect<
    ChallengeVerificationState,
    VerificationNotFoundError | UnexpectedServerError
  >
  deleteChallengeVerificationState: (
    state: PublicKeyPemBase64
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class VerificationStateDbService extends Context.Tag(
  'VerificationStateDbService'
)<VerificationStateDbService, VerificationStateDbOperations>() {
  static readonly Live = Layer.effect(
    VerificationStateDbService,
    Effect.gen(function* (_) {
      const redis = yield* _(RedisService)
      const storeVerificationState = redis.set(PhoneVerificationState)
      const getPhoneVerificationState = redis.get(PhoneVerificationState)

      const storeChallengeState = redis.set(ChallengeVerificationState)
      const getChallengeState = redis.get(ChallengeVerificationState)

      const toReturn: VerificationStateDbOperations = {
        storePhoneVerificationState: (state) =>
          storeVerificationState(
            `${PHONE_VERIFICATION_STATE_PREFIX}${state.id}`,
            state,
            {
              expiresAt: unixMillisecondsFromNow(
                VERIFICATION_EXPIRES_AFTER_MILIS
              ),
            }
          ).pipe(
            Effect.catchAll((e) =>
              Effect.zipLeft(
                Effect.logError(
                  'Error while storing phone verification state',
                  e
                ),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            )
          ),
        retrievePhoneVerificationState: (id) =>
          getPhoneVerificationState(
            `${PHONE_VERIFICATION_STATE_PREFIX}${id}`
          ).pipe(
            Effect.catchTags({
              ParseError: () =>
                Effect.fail(new UnexpectedServerError({status: 500})),
              RecordDoesNotExistsReddisError: () =>
                Effect.fail(
                  new VerificationNotFoundError({status: 404, code: '100104'})
                ),
              RedisError: () =>
                Effect.fail(new UnexpectedServerError({status: 500})),
            })
          ),
        storeChallengeVerificationState: (state) =>
          storeChallengeState(
            `${CHALLENGE_VERIFICATION_STATE_PREFIX}${state.publicKey}`,
            state,
            {
              expiresAt: unixMillisecondsFromNow(
                VERIFICATION_EXPIRES_AFTER_MILIS
              ),
            }
          ).pipe(
            Effect.catchAll((e) =>
              Effect.zipRight(
                Effect.logError(
                  'Error while storing phone verification state',
                  e
                ),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            )
          ),
        retrieveChallengeVerificationState: (id) =>
          getChallengeState(`${CHALLENGE_VERIFICATION_STATE_PREFIX}${id}`).pipe(
            Effect.catchTags({
              ParseError: () =>
                Effect.fail(new UnexpectedServerError({status: 500})),
              RecordDoesNotExistsReddisError: () =>
                Effect.fail(
                  new VerificationNotFoundError({status: 404, code: '100104'})
                ),
              RedisError: () =>
                Effect.fail(new UnexpectedServerError({status: 500})),
            })
          ),
        deleteChallengeVerificationState: (id) =>
          redis.delete(`${CHALLENGE_VERIFICATION_STATE_PREFIX}${id}`).pipe(
            Effect.catchAll((e) => {
              return Effect.zipRight(
                Effect.logError(
                  'Error while storing phone verification state',
                  e
                ),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            })
          ),
        deletePhoneVerificationState: (id) =>
          redis.delete(`${PHONE_VERIFICATION_STATE_PREFIX}${id}`).pipe(
            Effect.catchAll((e) => {
              return Effect.zipLeft(
                Effect.logError(
                  'Error while storing phone verification state',
                  e
                ),
                Effect.fail(new UnexpectedServerError({status: 500}))
              )
            })
          ),
      }
      return toReturn
    })
  )
}
