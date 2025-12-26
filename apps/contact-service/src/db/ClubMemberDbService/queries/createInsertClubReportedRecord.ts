import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const InsertClubReportedRecordParams = Schema.Struct({
  userPublicKey: PublicKeyPemBase64,
  reportedAt: Schema.DateFromSelf,
})

export type InsertClubReportedRecordParams =
  typeof InsertClubReportedRecordParams.Type

export const createInsertClubReportedRecord = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: InsertClubReportedRecordParams,
    execute: (params) => sql`
      INSERT INTO
        club_reported_record ${sql.insert(params)}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error inserting club reported record', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
