import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {NoteAdminIdHashed, NotePublicPartRecord} from '../domain'

export const QueryNoteByAdminIdRequest = NoteAdminIdHashed
export type QueryNoteByAdminIdRequest = typeof QueryNoteByAdminIdRequest.Type

export const createQueryNotePublicPartByAdminId = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const QueryNotePublicPartByAdminId = SqlResolver.grouped({
    Request: QueryNoteByAdminIdRequest,
    RequestGroupKey: (req) => req,
    ResultGroupKey: (res) => res.adminId,
    Result: NotePublicPartRecord,
    execute: (adminIds) => sql`
      SELECT
        *
      FROM
        note_public
      WHERE
        ${sql.in('admin_id', adminIds)}
    `,
  })
  return flow(
    SqlResolver.request(QueryNotePublicPartByAdminId),
    Effect.catchTag('NoSuchElementError', () => Effect.succeed([])),
    Effect.map(Array.head),
    UnexpectedServerError.wrapErrors('Error querying note by admin id')
  )
})
