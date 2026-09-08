import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {omit} from 'effect/Struct'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubDbRecord, ClubRecordId} from '../domain'

export const UpdateClubParams = Schema.Struct({
  id: ClubRecordId,
  data: Schema.Struct(omit(ClubDbRecord.fields, ['id', 'uuid'])),
})
export type UpdateClubParams = typeof UpdateClubParams.Type

export const createUpdateClub = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOne({
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
    UnexpectedServerError.wrapErrors('Error in updateClub query'),
    Effect.withSpan('updateClub query')
  )
})
