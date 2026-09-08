import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {OfferAdminIdHashed, PublicPartRecord} from '../domain'

export const QueryOfferByAdminIdRequest = OfferAdminIdHashed
export type QueryOfferByAdminIdRequest = typeof QueryOfferByAdminIdRequest.Type

export const createQueryPublicPartByAdminId = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const QueryPublicPartByAdminId = SqlResolver.grouped({
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
  return flow(
    SqlResolver.request(QueryPublicPartByAdminId),
    Effect.catchTag('NoSuchElementError', () => Effect.succeed([])),
    Effect.map(Array.head),
    UnexpectedServerError.wrapErrors('Error querying offers by admin id')
  )
})
