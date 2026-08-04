import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubDbRecord} from '../domain'

export const UpdateReactivateClubParams = Schema.Struct({
  clubUuid: ClubUuid,
})
export type UpdateReactivateClubParams = typeof UpdateReactivateClubParams.Type

export const createUpdateReactivateClub = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: UpdateReactivateClubParams,
    Result: ClubDbRecord,
    execute: ({clubUuid}) => sql`
      UPDATE club
      SET
        made_inactive_at = NULL,
        made_inactive_reason = NULL
      WHERE
        UUID = ${clubUuid}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateReactivateClub query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateReactivateClub query')
  )
})
