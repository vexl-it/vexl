import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {objectCopyAndOmit} from '@vexl-next/generic-utils/src/objectCopyAndOmit'
import {Effect, flow, Schema} from 'effect'
import {ClubMemberRecord} from '../domain'

export const InsertClubMemeberParams = Schema.Struct({
  ...objectCopyAndOmit(ClubMemberRecord.fields, 'id'),
})
export type InsertClubMemeberParams = typeof InsertClubMemeberParams.Type

export const createInsertClubMember = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
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
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in insertClubMemeber query', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('insertClubMemeber query')
  )
})
