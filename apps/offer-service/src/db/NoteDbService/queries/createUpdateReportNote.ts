import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NoteId} from '@vexl-next/domain/src/general/notes'
import {Effect, Schema} from 'effect'
import {noteNotExpired} from '../utils'

export const UpdateReportNoteRequest = Schema.Struct({
  noteId: NoteId,
  userPublicKey: PublicKeyPemBase64,
})
export type UpdateReportNoteRequest = typeof UpdateReportNoteRequest.Type

export const createUpdateReportNote = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  return (request: UpdateReportNoteRequest) =>
    sql`
      UPDATE note_public
      SET
        report = report + 1
      WHERE
        ${sql.and([sql`note_id = ${request.noteId}`, noteNotExpired(sql)])}
    `.pipe(
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error updating report note', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
})
