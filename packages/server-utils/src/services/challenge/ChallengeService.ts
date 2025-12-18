import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  ecdsaVerifyE,
  generateChallenge,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  Challenge,
  type SignedChallenge,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {Context, Effect, Layer, Option, Schema} from 'effect'
import {
  withRedisLock,
  type RedisLockError,
  type RedisService,
} from '../../RedisService'
import {ChallengeDbService} from './db/ChallegeDbService'

export const generateRandomChallenge = generateChallenge().pipe(
  Effect.flatMap(Schema.decode(Challenge)),
  Effect.catchAll((e) =>
    Effect.zipRight(
      Effect.log('Error while normalizing challenge', e),
      new UnexpectedServerError({status: 500, cause: e})
    )
  )
)

export interface ChallengeOperations {
  createChallenge: (
    args: PublicKeyPemBase64
  ) => Effect.Effect<Challenge, UnexpectedServerError>
  verifyChallenge: (args: {
    signedChallenge: SignedChallenge
    publicKey: PublicKeyPemBase64
  }) => Effect.Effect<
    boolean,
    UnexpectedServerError | RedisLockError,
    RedisService
  >
}

export class ChallengeService extends Context.Tag('ChallengeService')<
  ChallengeService,
  ChallengeOperations
>() {
  static readonly Live = Layer.effect(
    ChallengeService,
    Effect.gen(function* (_) {
      const challengeDb = yield* _(ChallengeDbService)

      const createChallenge: ChallengeOperations['createChallenge'] = (
        publicKey: PublicKeyPemBase64
      ) =>
        Effect.gen(function* (_) {
          const challenge = yield* _(generateRandomChallenge)
          yield* _(
            challengeDb.insertChallenge({
              challenge,
              publicKey,
              createdAt: new Date(),
              valid: true,
            })
          )

          return challenge
        }).pipe(Effect.withSpan('CreateChallenge'))

      const verifyChallenge: ChallengeOperations['verifyChallenge'] = ({
        signedChallenge: {challenge, signature},
        publicKey,
      }) =>
        Effect.gen(function* (_) {
          const challengeRecord = yield* _(
            challengeDb.findChallengeByChallengeAndPublicKey({
              challenge,
              publicKey,
            })
          )

          if (Option.isNone(challengeRecord)) return false

          const isValid = yield* _(
            ecdsaVerifyE(publicKey)({data: challenge, signature}),
            Effect.catchAll((e) =>
              Effect.zipRight(
                Effect.log('Error while verifying challenge', e),
                Effect.succeed(false)
              )
            )
          )

          if (isValid) {
            yield* _(challengeDb.deleteChallenge(challenge))
          }

          return isValid
        }).pipe(
          withRedisLock(`verifyChallenge:${challenge}`, 2_000),
          Effect.withSpan('VerifyChallenge')
        )

      return {
        createChallenge,
        verifyChallenge,
      }
    })
  )
}
