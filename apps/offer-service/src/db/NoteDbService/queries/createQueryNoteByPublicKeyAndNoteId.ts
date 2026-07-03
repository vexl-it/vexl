import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {NoteId} from '@vexl-next/domain/src/general/notes'
import {Array, Effect, flow, Schema} from 'effect'
import {offerReportFilterConfig} from '../../../configs'
import {
  noteNotExpired,
  noteNotFlagged,
  noteSelect,
  NoteSelectToNoteParts,
} from '../utils'

export const QueryNoteByPublicKeyAndNoteIdRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  userPublicKeyV2: Schema.optionalWith(PublicKeyV2, {as: 'Option'}),
  id: NoteId,
  skipValidation: Schema.optional(Schema.Boolean),
})
export type QueryNoteByPublicKeyAndNoteIdRequest =
  typeof QueryNoteByPublicKeyAndNoteIdRequest.Type

export const createQueryNoteByPublicKeyAndNoteId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const noteReportFilter = yield* _(offerReportFilterConfig)

  const query = SqlSchema.findAll({
    Request: QueryNoteByPublicKeyAndNoteIdRequest,
    Result: NoteSelectToNoteParts,
    execute: (params) => sql`
      SELECT
        ${noteSelect(sql)}
      FROM
        note_public
        INNER JOIN note_private ON note_public.id = note_private.note_id
      WHERE
        ${sql.and([
        sql`note_public.note_id = ${params.id}`,
        sql.or([
          sql`note_private.user_public_key = ${params.userPublicKey}`,
          sql`
            note_private.user_public_key = ${params.userPublicKeyV2 ??
            // Avoid comparing the v2 public key with null in the database,
            // which would match all notes where the v2 public key is null
            'no-key'}
          `,
        ]),
        params.skipValidation ? 'true' : noteNotExpired(sql),
        params.skipValidation ? 'true' : noteNotFlagged(sql, noteReportFilter),
      ])}
    `,
  })
  return flow(
    query,
    Effect.map(Array.head),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying note by public key and note id', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
