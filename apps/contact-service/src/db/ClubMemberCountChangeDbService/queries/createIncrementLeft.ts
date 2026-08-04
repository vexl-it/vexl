import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const IncrementLeftParams = Schema.Struct({
  clubId: ClubRecordId,
  count: Schema.Int,
})
export type IncrementLeftParams = typeof IncrementLeftParams.Type

export const createIncrementLeft = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: IncrementLeftParams,
    execute: (params) => sql`
      INSERT INTO
        club_member_count_change (club_id, DAY, joined_count, left_count)
      VALUES
        (
          ${params.clubId},
          current_date,
          0,
          ${params.count}
        )
      ON CONFLICT (club_id, DAY) DO UPDATE
      SET
        left_count = club_member_count_change.left_count + excluded.left_count
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in incrementLeft query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('incrementLeft query')
  )
})
