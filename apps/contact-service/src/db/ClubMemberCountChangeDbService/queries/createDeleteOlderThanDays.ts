import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const DeleteOlderThanDaysParams = Schema.Struct({
  days: Schema.Int,
})
export type DeleteOlderThanDaysParams = typeof DeleteOlderThanDaysParams.Type

export const createDeleteOlderThanDays = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: DeleteOlderThanDaysParams,
    execute: (params) => sql`
      DELETE FROM club_member_count_change
      WHERE
        DAY < (
          current_date - (${params.days})::int
        )
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError(
          'Error in deleteClubMemberCountChangesOlderThanDays query',
          e
        ),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('deleteClubMemberCountChangesOlderThanDays query')
  )
})
