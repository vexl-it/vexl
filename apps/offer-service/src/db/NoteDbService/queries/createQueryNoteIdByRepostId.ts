import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Option, Schema} from 'effect'
import {NotePublicPartId, NoteRepostIdHashed} from '../domain'

export const QueryNoteIdByRepostIdRequest = NoteRepostIdHashed
export type QueryNoteIdByRepostIdRequest =
  typeof QueryNoteIdByRepostIdRequest.Type

const QueryNoteIdByRepostIdResult = Schema.Struct({
  noteId: NotePublicPartId,
  repostId: NoteRepostIdHashed,
})

export const createQueryNoteIdByRepostId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const QueryNoteIdByRepostId = yield* _(
    SqlResolver.grouped('QueryNoteIdByRepostId', {
      Request: QueryNoteIdByRepostIdRequest,
      RequestGroupKey: (req) => req,
      ResultGroupKey: (res) => res.repostId,
      Result: QueryNoteIdByRepostIdResult,
      execute: (repostIds) => sql`
        SELECT DISTINCT
          note_id,
          repost_id
        FROM
          note_private
        WHERE
          ${sql.in('repost_id', repostIds)}
      `,
    })
  )
  return flow(
    QueryNoteIdByRepostId.execute,
    Effect.map(Array.head),
    Effect.map(Option.map((one) => one.noteId)),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying note id by repost id', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
