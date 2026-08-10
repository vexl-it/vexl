import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePayloadEncrypted} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Schema} from 'effect'
import {NotePublicPartId, NoteRepostIdHashed} from '../domain'

export const InsertNotePrivatePartRequest = Schema.Struct({
  userPublicKey: Schema.Union(PublicKeyPemBase64, PublicKeyV2),
  payloadPrivate: PrivatePayloadEncrypted,
  noteId: NotePublicPartId,
  repostId: Schema.NullOr(NoteRepostIdHashed),
})
export type InsertNotePrivatePartRequest =
  typeof InsertNotePrivatePartRequest.Type

export const createInsertNotePrivatePart = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const InsertNotePrivateParts = yield* _(
    SqlResolver.void('InsertNotePrivatePart', {
      Request: InsertNotePrivatePartRequest,
      execute: (requests) => sql`
        INSERT INTO
          note_private ${sql.insert(requests)}
        RETURNING
          note_private.*
      `,
    })
  )

  return flow(
    InsertNotePrivateParts.execute,
    UnexpectedServerError.wrapErrors('Error inserting note private part')
  )
})
