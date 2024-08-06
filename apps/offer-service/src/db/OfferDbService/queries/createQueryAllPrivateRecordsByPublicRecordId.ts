import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {PrivatePartRecord, PublicPartId} from '../domain'

export const createQueryAllPrivateRecordsByPublicRecordId = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const QueryOffer = yield* _(
      SqlResolver.grouped('QueryAllPrivateRecordsByPublicRecordId', {
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
    )
    return flow(
      QueryOffer.execute,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error quering all private records by public record id',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
  }
)
