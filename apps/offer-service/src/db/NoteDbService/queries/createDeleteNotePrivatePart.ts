import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {NotePublicPartId} from '../domain'

export const DeleteNotePrivatePartRequest = Schema.Struct({
  userPublicKey: Schema.Union(PublicKeyPemBase64, PublicKeyV2),
  noteId: NotePublicPartId,
})
export type DeleteNotePrivatePartRequest =
  typeof DeleteNotePrivatePartRequest.Type

export const createDeleteNotePrivatePart = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const DeleteNotePrivatePart = yield* _(
    SqlResolver.void('DeleteNotePrivatePart', {
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
  )
  return flow(
    DeleteNotePrivatePart.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error deleting note private part', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
