import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  ecdsaVerifyE,
  generateChallenge,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  ChatChallenge,
  type SignedChallenge,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {
  withRedisLock,
  type RedisLockError,
  type RedisService,
} from '@vexl-next/server-utils/src/RedisService'
import {Context, Effect, Layer, Option, Schema} from 'effect'
import {ChallengeDbService} from '../db/ChallegeDbService'

export const generateRandomChatChallenge = generateChallenge().pipe(
  Effect.flatMap(Schema.decode(ChatChallenge)),
  Effect.catchAll((e) =>
    Effect.zipRight(
      Effect.log('Error while normalizing challenge', e),
      new UnexpectedServerError({status: 500, cause: e})
    )
  )
)

export interface ChatChallengeOperations {
  createChallenge: (
    args: PublicKeyPemBase64
  ) => Effect.Effect<ChatChallenge, UnexpectedServerError>
  verifyChallenge: (args: {
    signedChallenge: SignedChallenge
    publicKey: PublicKeyPemBase64
  }) => Effect.Effect<
    boolean,
    UnexpectedServerError | RedisLockError,
    RedisService
  >
}

export class ChatChallengeService extends Context.Tag('ChatChallengeService')<
  ChatChallengeService,
  ChatChallengeOperations
>() {
  static readonly Live = Layer.effect(
    ChatChallengeService,
    Effect.gen(function* (_) {
      const challengeDb = yield* _(ChallengeDbService)

      const createChatChallenge: ChatChallengeOperations['createChallenge'] = (
        publicKey: PublicKeyPemBase64
      ) =>
        Effect.gen(function* (_) {
          const challenge = yield* _(generateRandomChatChallenge)
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

      const verifyChallenge: ChatChallengeOperations['verifyChallenge'] = ({
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
          withRedisLock(`verifyChallenge:${challenge}`),
          Effect.withSpan('VerifyChallenge')
        )

      return {
        createChallenge: createChatChallenge,
        verifyChallenge,
      }
    })
  )
}
