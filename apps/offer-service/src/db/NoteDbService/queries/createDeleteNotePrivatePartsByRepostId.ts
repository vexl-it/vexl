import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {NoteRepostIdHashed} from '../domain'

const DeleteNotePrivatePartsByRepostIdRequest = NoteRepostIdHashed
export type DeleteNotePrivatePartsByRepostIdRequest =
  typeof DeleteNotePrivatePartsByRepostIdRequest.Type

export const createDeleteNotePrivatePartsByRepostId = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const DeleteNotePrivatePartsByRepostId = SqlResolver.void({
    Request: DeleteNotePrivatePartsByRepostIdRequest,
    execute: (req) => sql`
      DELETE FROM note_private
      WHERE
        ${sql.in('repost_id', req)}
    `,
  })
  return flow(
    SqlResolver.request(DeleteNotePrivatePartsByRepostId),
    UnexpectedServerError.wrapErrors(
      'Error deleting note private parts by repost id'
    )
  )
})
