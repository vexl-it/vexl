import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect} from 'effect'
import {challengeExpirationMinutesConfig} from '../configs'

export const createDeleteInvalidAndExpiredChallenges = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const expirationMinutes = yield* _(challengeExpirationMinutesConfig)

    return () =>
      sql`
        DELETE FROM challenge
        WHERE
          valid = FALSE
          OR created_at < now() - interval '1 MINUTE' * ${expirationMinutes}
      `.pipe(
        Effect.catchAll((e) =>
          Effect.zipRight(
            Effect.logError('Error in deleteInvalidAndExpiredChallenges', e),
            Effect.fail(new UnexpectedServerError({status: 500}))
          )
        ),
        Effect.withSpan('deleteInvalidAndExpiredChallenges query')
      )
  }
)
