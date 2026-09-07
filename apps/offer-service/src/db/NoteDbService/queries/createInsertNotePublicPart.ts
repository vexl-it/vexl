import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NoteId} from '@vexl-next/domain/src/general/notes'
import {PublicPayloadEncrypted} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Schema} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {NoteAdminIdHashed, NotePublicPartRecord} from '../domain'

export const InsertNotePublicPartRequest = Schema.Struct({
  adminId: NoteAdminIdHashed,
  noteId: NoteId,
  payloadPublic: PublicPayloadEncrypted,
  expiresAt: Schema.Date,
})
export type InsertNotePublicPartRequest =
  typeof InsertNotePublicPartRequest.Type

export const createInsertNotePublicPart = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const InsertNotePublicPart = SqlResolver.ordered({
    Request: InsertNotePublicPartRequest,
    Result: NotePublicPartRecord,
    execute: (requests) => sql`
      INSERT INTO
        note_public ${sql.insert(requests)}
      RETURNING
        *
    `,
  })

  return flow(
    SqlResolver.request(InsertNotePublicPart),
    UnexpectedServerError.wrapErrors('Error inserting note public part')
  )
})
