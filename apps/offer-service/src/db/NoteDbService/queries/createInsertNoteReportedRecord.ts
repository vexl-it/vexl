import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const InsertNoteReportedRecordParams = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  reportedAt: Schema.DateFromSelf,
})
export type InsertNoteReportedRecordParams =
  typeof InsertNoteReportedRecordParams.Type

export const createInsertNoteReportedRecord = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: InsertNoteReportedRecordParams,
    execute: (params) => sql`
      INSERT INTO
        note_reported_record ${sql.insert(params)}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error inserting note reported record', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
