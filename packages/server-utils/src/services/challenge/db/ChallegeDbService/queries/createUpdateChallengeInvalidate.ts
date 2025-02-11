import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {Challenge} from '../../../contracts'

export const createUpdateChallengeInvalidate = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const resolver = yield* _(
    SqlResolver.void('updateChallengeInvalidate', {
      Request: Challenge,
      execute: (params) => sql`
        UPDATE challenge
        SET
          valid = FALSE
        WHERE
          ${sql.in('challenge', params)}
      `,
    })
  )

  return flow(
    resolver.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateChallengeInvalidate', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateChallengeInvalidate query')
  )
})
