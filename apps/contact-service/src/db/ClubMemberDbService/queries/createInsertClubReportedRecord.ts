import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'

export const InsertClubReportedRecordParams = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  reportedAt: Schema.Date,
})

export type InsertClubReportedRecordParams =
  typeof InsertClubReportedRecordParams.Type

export const createInsertClubReportedRecord = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: InsertClubReportedRecordParams,
    execute: (params) => sql`
      INSERT INTO
        club_reported_record ${sql.insert(params)}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error inserting club reported record')
  )
})
