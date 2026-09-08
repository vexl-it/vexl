import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {NoteAdminIdHashed} from '../domain'

const DeleteNotePublicPartRequest = NoteAdminIdHashed
export type DeleteNotePublicPartRequest =
  typeof DeleteNotePublicPartRequest.Type

export const createDeleteNotePublicPart = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const DeleteNotePublicPart = SqlResolver.void({
    Request: DeleteNotePublicPartRequest,
    execute: (req) => sql`
      DELETE FROM note_public
      WHERE
        ${sql.in('admin_id', req)}
    `,
  })
  return flow(
    SqlResolver.request(DeleteNotePublicPart),
    UnexpectedServerError.wrapErrors('Error deleting note public part')
  )
})
