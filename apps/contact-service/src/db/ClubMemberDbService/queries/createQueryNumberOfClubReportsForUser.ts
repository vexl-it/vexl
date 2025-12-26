import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Option, Schema} from 'effect'
import {clubReportLimitIntervalDaysConfig} from '../../../configs'

export const createQueryNumberOfClubReportsForUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const clubReportLimitIntervalDays = yield* _(
    clubReportLimitIntervalDaysConfig
  )

  const query = SqlSchema.findAll({
    Request: PublicKeyPemBase64,
    Result: Schema.Struct({
      numberOfClubReports: Schema.Int,
    }),
    execute: (userPublicKey) => {
      return sql`
        SELECT
          COUNT(*)::int AS "numberOfClubReports"
        FROM
          club_reported_record
        WHERE
          user_public_key = ${userPublicKey}
          AND reported_at >= (
            now() - interval '1 DAY' * ${clubReportLimitIntervalDays}
          )::date
      `
    },
  })

  return flow(
    query,
    Effect.map(
      flow(
        Array.map((a) => a.numberOfClubReports),
        Array.head,
        Option.getOrElse(() => 0)
      )
    ),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying number of club reports for user.', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
