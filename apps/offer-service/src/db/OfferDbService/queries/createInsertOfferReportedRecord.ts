import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const InsertOfferReportedRecordParams = Schema.Struct({
  userPublicKey: PublicKeyPemBase64E,
  reportedAt: Schema.DateFromSelf,
})

export type InsertOfferReportedRecordParams =
  typeof InsertOfferReportedRecordParams.Type

export const createInsertOfferReportedRecord = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: InsertOfferReportedRecordParams,
    execute: (params) => sql`
      INSERT INTO
        offer_reported_record ${sql.insert(params)}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error inserting offer reported record', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
