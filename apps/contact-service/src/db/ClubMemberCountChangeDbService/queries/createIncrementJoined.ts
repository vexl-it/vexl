import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {ClubRecordId} from '../../ClubsDbService/domain'

export const IncrementJoinedParams = Schema.Struct({
  clubId: ClubRecordId,
  count: Schema.Int,
})
export type IncrementJoinedParams = typeof IncrementJoinedParams.Type

export const createIncrementJoined = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: IncrementJoinedParams,
    execute: (params) => sql`
      INSERT INTO
        club_member_count_change (club_id, DAY, joined_count, left_count)
      VALUES
        (
          ${params.clubId},
          current_date,
          ${params.count},
          0
        )
      ON CONFLICT (club_id, DAY) DO UPDATE
      SET
        joined_count = club_member_count_change.joined_count + excluded.joined_count
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in incrementJoined query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('incrementJoined query')
  )
})
