import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, type Schema} from 'effect'
import {OfferAdminIdHashed, PublicPartRecord} from '../domain'

export const QueryOfferByAdminIdRequest = OfferAdminIdHashed
export type QueryOfferByAdminIdRequest = Schema.Schema.Type<
  typeof QueryOfferByAdminIdRequest
>

export const createQueryPublicPartByAdminId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const QueryPublicPartByAdminId = yield* _(
    SqlResolver.grouped('QueryPublicPartByAdminId', {
      Request: QueryOfferByAdminIdRequest,
      RequestGroupKey: (req) => req,
      ResultGroupKey: (res) => res.adminId,
      Result: PublicPartRecord,
      execute: (adminIds) => {
        return sql`
          SELECT
            *
          FROM
            offer_public
          WHERE
            ${sql.in('admin_id', adminIds)}
        `
      },
    })
  )
  return flow(
    QueryPublicPartByAdminId.execute,
    Effect.map(Array.head),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying offers by admin id', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
