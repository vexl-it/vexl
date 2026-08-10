import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {NoteRepostIdHashed} from '../domain'

const DeleteNotePrivatePartsByRepostIdRequest = NoteRepostIdHashed
export type DeleteNotePrivatePartsByRepostIdRequest =
  typeof DeleteNotePrivatePartsByRepostIdRequest.Type

export const createDeleteNotePrivatePartsByRepostId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const DeleteNotePrivatePartsByRepostId = yield* _(
    SqlResolver.void('DeleteNotePrivatePartsByRepostId', {
      Request: DeleteNotePrivatePartsByRepostIdRequest,
      execute: (req) => sql`
        DELETE FROM note_private
        WHERE
          ${sql.in('repost_id', req)}
      `,
    })
  )
  return flow(
    DeleteNotePrivatePartsByRepostId.execute,
    UnexpectedServerError.wrapErrors(
      'Error deleting note private parts by repost id'
    )
  )
})
