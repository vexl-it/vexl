import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NoteId} from '@vexl-next/domain/src/general/notes'
import {Array, Effect, flow, Schema} from 'effect'
import {offerReportFilterConfig} from '../../../configs'
import {noteNotExpired, noteNotFlagged} from '../utils'

export const QueryNoteIdsForUserRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  userPublicKeyV2: Schema.optionalWith(PublicKeyV2, {as: 'Option'}),
})
export type QueryNoteIdsForUserRequest = Schema.Schema.Type<
  typeof QueryNoteIdsForUserRequest
>

export const createQueryNoteIdsForUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const noteReportFilter = yield* _(offerReportFilterConfig)

  const query = SqlSchema.findAll({
    Request: QueryNoteIdsForUserRequest,
    Result: Schema.Struct({
      noteId: NoteId,
    }),
    execute: (params) => sql`
      SELECT DISTINCT
        note_public.note_id AS note_id
      FROM
        note_public
        INNER JOIN note_private ON note_public.id = note_private.note_id
      WHERE
        ${sql.and([
        sql.or([
          sql`user_public_key = ${params.userPublicKey}`,
          sql`
            user_public_key = ${params.userPublicKeyV2 ??
            // Avoid comparing the v2 public key with null in the database,
            // which would match all notes where the v2 public key is null
            'no-key'}
          `,
        ]),
        noteNotExpired(sql),
        noteNotFlagged(sql, noteReportFilter),
      ])}
    `,
  })

  return flow(
    query,
    Effect.map(Array.map((a) => a.noteId)),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying note ids for user', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
