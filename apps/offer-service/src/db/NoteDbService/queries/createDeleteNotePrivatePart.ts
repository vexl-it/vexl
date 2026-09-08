import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {NotePublicPartId} from '../domain'

export const DeleteNotePrivatePartRequest = Schema.Struct({
  userPublicKey: Schema.Union([PublicKeyPemBase64, PublicKeyV2]),
  noteId: NotePublicPartId,
})
export type DeleteNotePrivatePartRequest =
  typeof DeleteNotePrivatePartRequest.Type

export const createDeleteNotePrivatePart = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const DeleteNotePrivatePart = SqlResolver.void({
    Request: DeleteNotePrivatePartRequest,
    // Only direct private parts (created by the note author) are removed.
    // Reposted private parts are owned by the reposter and are managed
    // through undoRepostNote instead.
    execute: (req) => sql`
      DELETE FROM note_private
      WHERE
        repost_id IS NULL
        AND ${sql.or(
        req.map((one) =>
          sql.and([
            sql`note_id = ${one.noteId}`,
            sql`user_public_key = ${one.userPublicKey}`,
          ])
        )
      )}
    `,
  })
  return flow(
    SqlResolver.request(DeleteNotePrivatePart),
    UnexpectedServerError.wrapErrors('Error deleting note private part')
  )
})
