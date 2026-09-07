import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Option, Schema} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {NotePublicPartId, NoteRepostIdHashed} from '../domain'

export const QueryNoteIdByRepostIdRequest = NoteRepostIdHashed
export type QueryNoteIdByRepostIdRequest =
  typeof QueryNoteIdByRepostIdRequest.Type

const QueryNoteIdByRepostIdResult = Schema.Struct({
  noteId: NotePublicPartId,
  repostId: NoteRepostIdHashed,
})

export const createQueryNoteIdByRepostId = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const QueryNoteIdByRepostId = SqlResolver.grouped({
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
  return flow(
    SqlResolver.request(QueryNoteIdByRepostId),
    Effect.catchTag('NoSuchElementError', () => Effect.succeed([])),
    Effect.map(Array.head),
    Effect.map(Option.map((one) => one.noteId)),
    UnexpectedServerError.wrapErrors('Error querying note id by repost id')
  )
})
