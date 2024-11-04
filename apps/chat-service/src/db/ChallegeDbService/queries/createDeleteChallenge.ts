import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ChatChallenge} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Effect, flow} from 'effect'

export const createDeleteChallenge = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const resolver = yield* _(
    SqlResolver.void('deleteChallenge', {
      Request: ChatChallenge,
      execute: (params) => sql`
        DELETE FROM challenge
        WHERE
          ${sql.in('challenge', params)}
      `,
    })
  )

  return flow(
    resolver.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteChallenge', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteChallenge query')
  )
})
