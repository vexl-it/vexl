import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow} from 'effect'
import {NoteAdminIdHashed, NotePublicPartRecord} from '../domain'

export const QueryNoteByAdminIdRequest = NoteAdminIdHashed
export type QueryNoteByAdminIdRequest = typeof QueryNoteByAdminIdRequest.Type

export const createQueryNotePublicPartByAdminId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const QueryNotePublicPartByAdminId = yield* _(
    SqlResolver.grouped('QueryNotePublicPartByAdminId', {
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
  )
  return flow(
    QueryNotePublicPartByAdminId.execute,
    Effect.map(Array.head),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying note by admin id', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
