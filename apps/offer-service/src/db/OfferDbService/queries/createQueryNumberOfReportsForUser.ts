import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Option, Schema} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {reportLimitIntervalDaysConfig} from '../../../configs'

export const createQueryNumberOfReportsForUser = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient
  const reportLimitIntervalDays = yield* reportLimitIntervalDaysConfig

  const QueryOffers = SqlResolver.grouped({
    Request: PublicKeyPemBase64,
    RequestGroupKey: (userPublicKey) => userPublicKey,
    Result: Schema.Struct({
      numberOfReports: Schema.Int,
      userPublicKey: PublicKeyPemBase64,
    }),
    ResultGroupKey: (result) => result.userPublicKey,
    execute: (query) => {
      return sql`
        SELECT
          COUNT(*)::int AS "numberOfReports",
          user_public_key
        FROM
          offer_reported_record
        WHERE
          ${sql.and([
          sql.in('user_public_key', query),
          sql`
            reported_at >= (
              now() - interval '1 DAY' * ${reportLimitIntervalDays}
            )::date
          `,
        ])}
        GROUP BY
          user_public_key
      `
    },
  })

  return flow(
    SqlResolver.request(QueryOffers),
    Effect.catchTag('NoSuchElementError', () => Effect.succeed([])),
    Effect.map(
      flow(
        Array.map((a) => a.numberOfReports),
        Array.head,
        Option.getOrElse(() => 0)
      )
    ),
    UnexpectedServerError.wrapErrors(
      'Error querying Number of reports for user.'
    )
  )
})
