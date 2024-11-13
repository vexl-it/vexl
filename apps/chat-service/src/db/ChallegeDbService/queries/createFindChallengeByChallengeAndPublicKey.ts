import {SqlClient, SqlSchema} from '@effect/sql'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ChatChallenge} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Effect, Schema, flow} from 'effect'
import {challengeExpirationMinutesConfig} from '../../../configs'
import {ChallengeRecord} from '../domain'

export const FindChallengeByChallengeAndPublicKey = Schema.Struct({
  challenge: ChatChallenge,
  publicKey: PublicKeyPemBase64E,
})
export type FindChallengeByChallengeAndPublicKey =
  typeof FindChallengeByChallengeAndPublicKey.Type

export const createFindChallengeByChallengeAndPublicKey = Effect.gen(
  function* (_) {
    const sql = yield* _(SqlClient.SqlClient)
    const expirationMinutes = yield* _(challengeExpirationMinutesConfig)

    const query = SqlSchema.findOne({
      Request: FindChallengeByChallengeAndPublicKey,
      Result: ChallengeRecord,
      execute: (params) => sql`
        SELECT
          *
        FROM
          challenge
        WHERE
          challenge = ${params.challenge}
          AND public_key = ${params.publicKey}
          AND created_at > now() - interval '1 MINUTE' * ${expirationMinutes}
          AND valid = TRUE
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in findChallengeByChallengeAndPublicKey', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findChallengeByChallengeAndPublicKey query')
    )
  }
)
