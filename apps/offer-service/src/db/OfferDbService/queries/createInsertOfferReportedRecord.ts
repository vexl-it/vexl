import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'

export const InsertOfferReportedRecordParams = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  reportedAt: Schema.Date,
})

export type InsertOfferReportedRecordParams =
  typeof InsertOfferReportedRecordParams.Type

export const createInsertOfferReportedRecord = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: InsertOfferReportedRecordParams,
    execute: (params) => sql`
      INSERT INTO
        offer_reported_record ${sql.insert(params)}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error inserting offer reported record')
  )
})
