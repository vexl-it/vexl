import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {objectCopyAndOmit} from '@vexl-next/generic-utils/src/objectCopyAndOmit'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubMemberRecord} from '../domain'

export const InsertClubMemeberParams = Schema.Struct({
  ...objectCopyAndOmit(ClubMemberRecord.fields, 'id'),
})
export type InsertClubMemeberParams = typeof InsertClubMemeberParams.Type

export const createInsertClubMember = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOne({
    Request: InsertClubMemeberParams,
    Result: ClubMemberRecord,
    execute: (params) => sql`
      INSERT INTO
        club_member ${sql.insert(params)}
      RETURNING
        *
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in insertClubMemeber query'),
    Effect.withSpan('insertClubMemeber query')
  )
})
