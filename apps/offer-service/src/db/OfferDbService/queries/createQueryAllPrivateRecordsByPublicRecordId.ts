import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {PrivatePartRecord, PublicPartId} from '../domain'

export const createQueryAllPrivateRecordsByPublicRecordId = Effect.gen(
  function* () {
    const sql = yield* PgClient.PgClient

    const QueryOffer = SqlResolver.grouped({
      Request: PublicPartId,
      RequestGroupKey: (req) => String(req),
      ResultGroupKey: (res) => String(res.offerId),
      Result: PrivatePartRecord,
      execute: (offerIds) => {
        return sql`
          SELECT
            *
          FROM
            offer_private
          WHERE
            ${sql.in('offer_id', offerIds)}
        `
      },
    })
    return flow(
      SqlResolver.request(QueryOffer),
      Effect.catchTag('NoSuchElementError', () => Effect.succeed([])),
      UnexpectedServerError.wrapErrors(
        'Error quering all private records by public record id'
      )
    )
  }
)
