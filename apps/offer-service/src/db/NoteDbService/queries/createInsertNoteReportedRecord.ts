import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'

export const InsertNoteReportedRecordParams = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  reportedAt: Schema.Date,
})
export type InsertNoteReportedRecordParams =
  typeof InsertNoteReportedRecordParams.Type

export const createInsertNoteReportedRecord = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: InsertNoteReportedRecordParams,
    execute: (params) => sql`
      INSERT INTO
        note_reported_record ${sql.insert(params)}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error inserting note reported record')
  )
})
