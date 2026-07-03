import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NoteId} from '@vexl-next/domain/src/general/notes'
import {Array, Effect, flow} from 'effect'
import {NotePublicPartRecord} from '../domain'
import {noteNotExpired} from '../utils'

export const createQueryNotePublicPartByNoteId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: NoteId,
    Result: NotePublicPartRecord,
    execute: (noteId) => sql`
      SELECT
        *
      FROM
        note_public
      WHERE
        ${sql.and([sql`note_id = ${noteId}`, noteNotExpired(sql)])}
    `,
  })

  return flow(
    query,
    Effect.map(Array.head),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying note public part by note id', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
