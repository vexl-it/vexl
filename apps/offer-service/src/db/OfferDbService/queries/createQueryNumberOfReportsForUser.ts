import {Schema} from '@effect/schema'
import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Option} from 'effect'

export const createQueryNumberOfReportsForUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const QueryOffers = yield* _(
    SqlResolver.grouped('NumberOfReportsForUser', {
      Request: PublicKeyPemBase64E,
      RequestGroupKey: (userPublicKey) => userPublicKey,
      Result: Schema.Struct({
        numberOfReports: Schema.Int,
        userPublicKey: PublicKeyPemBase64E,
      }),
      ResultGroupKey: (result) => result.userPublicKey,
      execute: (query) => {
        return sql`
          SELECT
            sum(id) AS "numberOfReports",
            user_public_key
          FROM
            offer_reported_record
          WHERE
            ${sql.in('user_public_key', query)}
          GROUP BY
            user_public_key
        `
      },
    })
  )

  return flow(
    QueryOffers.execute,
    Effect.map(
      flow(
        Array.map((a) => a.numberOfReports),
        Array.head,
        Option.getOrElse(() => 0)
      )
    ),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying Number of reports for user.', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
