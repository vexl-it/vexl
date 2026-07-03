import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NoteId} from '@vexl-next/domain/src/general/notes'
import {PublicPayloadEncrypted} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Schema} from 'effect'
import {NoteAdminIdHashed, NotePublicPartRecord} from '../domain'

export const InsertNotePublicPartRequest = Schema.Struct({
  adminId: NoteAdminIdHashed,
  noteId: NoteId,
  payloadPublic: PublicPayloadEncrypted,
  expiresAt: Schema.DateFromSelf,
})
export type InsertNotePublicPartRequest =
  typeof InsertNotePublicPartRequest.Type

export const createInsertNotePublicPart = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const InsertNotePublicPart = yield* _(
    SqlResolver.ordered('InsertNotePublicPart', {
      Request: InsertNotePublicPartRequest,
      Result: NotePublicPartRecord,
      execute: (requests) => sql`
        INSERT INTO
          note_public ${sql.insert(requests)}
        RETURNING
          *
      `,
    })
  )

  return flow(
    InsertNotePublicPart.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error inserting note public part', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
