import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {omit} from 'effect/Struct'
import {ClubDbRecord, ClubRecordId} from '../domain'

export const UpdateClubParams = Schema.Struct({
  id: ClubRecordId,
  data: Schema.Struct(omit(ClubDbRecord.fields, 'id', 'uuid')),
})
export type UpdateClubParams = typeof UpdateClubParams.Type

export const createUpdateClub = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
    Request: UpdateClubParams,
    Result: ClubDbRecord,
    execute: (params) => sql`
      UPDATE club
      SET
        name = ${params.data.name},
        description = ${params.data.description ?? null},
        members_count_limit = ${params.data.membersCountLimit},
        club_image_url = ${params.data.clubImageUrl},
        valid_until = ${params.data.validUntil},
        report_limit = ${params.data.reportLimit}
      WHERE
        id = ${params.id}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateClub query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateClub query')
  )
})
