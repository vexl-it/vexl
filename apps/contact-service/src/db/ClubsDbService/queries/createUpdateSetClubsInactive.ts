import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubDbRecord, ClubRecordId} from '../domain'

export const UpdateSetClubsInactiveParams = Schema.Struct({
  id: Schema.Array(ClubRecordId),
})
export type UpdateSetClubsInactiveParams =
  typeof UpdateSetClubsInactiveParams.Type

export const createUpdateSetClubsInactive = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: UpdateSetClubsInactiveParams,
    Result: ClubDbRecord,
    execute: (params) => sql`
      UPDATE club
      SET
        made_inactive_at = now()
      WHERE
        ${sql.in('id', params.id)}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateSetClubsInactive query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateSetClubsInactive query')
  )
})
