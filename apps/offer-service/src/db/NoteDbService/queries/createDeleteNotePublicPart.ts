import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {NoteAdminIdHashed} from '../domain'

const DeleteNotePublicPartRequest = NoteAdminIdHashed
export type DeleteNotePublicPartRequest =
  typeof DeleteNotePublicPartRequest.Type

export const createDeleteNotePublicPart = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const DeleteNotePublicPart = yield* _(
    SqlResolver.void('DeleteNotePublicPart', {
      Request: DeleteNotePublicPartRequest,
      execute: (req) => sql`
        DELETE FROM note_public
        WHERE
          ${sql.in('admin_id', req)}
      `,
    })
  )
  return flow(
    DeleteNotePublicPart.execute,
    UnexpectedServerError.wrapErrors('Error deleting note public part')
  )
})
