import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Schema} from 'effect'
import {NotePublicPartId, NoteRepostIdHashed} from '../domain'

export const DeleteNotePrivatePartRequest = Schema.Struct({
  userPublicKey: Schema.Union(PublicKeyPemBase64, PublicKeyV2),
  noteId: NotePublicPartId,
  repostId: Schema.NullOr(NoteRepostIdHashed),
})
export type DeleteNotePrivatePartRequest =
  typeof DeleteNotePrivatePartRequest.Type

export const createDeleteNotePrivatePart = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const DeleteNotePrivatePart = yield* _(
    SqlResolver.void('DeleteNotePrivatePart', {
      Request: DeleteNotePrivatePartRequest,
      execute: (req) => sql`
        DELETE FROM note_private
        WHERE
          ${sql.or(
          Array.map(req, (one) =>
            sql.and([
              one.repostId === null
                ? sql`repost_id IS NULL`
                : sql`repost_id = ${one.repostId}`,
              sql`note_id = ${one.noteId}`,
              sql`user_public_key = ${one.userPublicKey}`,
            ])
          )
        )}
      `,
    })
  )
  return flow(
    DeleteNotePrivatePart.execute,
    UnexpectedServerError.wrapErrors('Error deleting note private part')
  )
})
