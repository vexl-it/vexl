import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../domain'

export const DeleteClubParams = Schema.Struct({
  id: ClubRecordId,
})
export type DeleteClubParams = typeof DeleteClubParams.Type

export const createDeleteClub = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const resolver = yield* _(
    SqlResolver.void('deleteClub', {
      Request: DeleteClubParams,
      execute: (params) => sql`
        DELETE FROM club
        WHERE
          ${sql.in(
          'id',
          params.map((one) => one.id)
        )}
      `,
    })
  )

  return flow(
    resolver.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in deleteClub query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteClub query')
  )
})
