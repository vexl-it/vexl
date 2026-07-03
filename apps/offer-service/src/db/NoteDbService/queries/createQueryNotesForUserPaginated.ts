import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {offerReportFilterConfig} from '../../../configs'
import {NoteChangeCounter, NotePrivatePartRecordId} from '../domain'
import {
  noteNotExpired,
  noteNotFlagged,
  noteSelect,
  NoteSelectWithNoteForUserUpdateCounterToNoteParts,
} from '../utils'

export const QueryNotesPaginatedRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  userPublicKeyV2: Schema.optionalWith(PublicKeyV2, {as: 'Option'}),
  lastNoteChangeCounter: NoteChangeCounter,
  lastPrivatePartId: NotePrivatePartRecordId,
  limit: Schema.Int,
})
export type QueryNotesPaginatedRequest = Schema.Schema.Type<
  typeof QueryNotesPaginatedRequest
>

export const createQueryNotesForUserPaginated = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const noteReportFilter = yield* _(offerReportFilterConfig)

  const query = SqlSchema.findAll({
    Request: QueryNotesPaginatedRequest,
    Result: NoteSelectWithNoteForUserUpdateCounterToNoteParts,
    execute: (params) => sql`
      SELECT
        *
      FROM
        (
          SELECT
            ${noteSelect(sql)},
            GREATEST(
              note_public.update_counter,
              note_private.update_counter
            ) AS note_for_user_update_counter
          FROM
            note_public
            INNER JOIN note_private ON note_public.id = note_private.note_id
          WHERE
            ${sql.and([
        sql.or([
          sql`note_private.user_public_key = ${params.userPublicKey}`,
          sql`
            note_private.user_public_key = ${params.userPublicKeyV2 ??
            // Avoid comparing the v2 public key with null in the database,
            // which would match all notes where the v2 public key is null
            'no-key'}
          `,
        ]),
        noteNotExpired(sql),
        noteNotFlagged(sql, noteReportFilter),
      ])}
        ) notes_for_user
      WHERE
        ${sql.or([
        sql` note_for_user_update_counter > ${params.lastNoteChangeCounter} `,
        sql.and([
          sql` note_for_user_update_counter = ${params.lastNoteChangeCounter} `,
          sql`"note_private.id" > ${params.lastPrivatePartId}`,
        ]),
      ])}
      ORDER BY
        note_for_user_update_counter ASC,
        "note_private.id" ASC
      LIMIT
        ${params.limit}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying notes for user (paginated)', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
