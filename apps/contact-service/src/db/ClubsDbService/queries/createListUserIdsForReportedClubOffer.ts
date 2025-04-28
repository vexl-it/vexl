import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferIdE} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, flow, Schema} from 'effect'

export const createListUserIdsForReportedClubOffer = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const ListUserIds = yield* _(
    SqlResolver.grouped('ListUserIdsForReportedClubOffer', {
      Request: OfferIdE,
      RequestGroupKey: (offerId) => offerId,
      Result: Schema.Struct({
        offerId: OfferIdE,
        userPublicKey: PublicKeyPemBase64E,
      }),
      ResultGroupKey: (result) => result.offerId,
      execute: (query) => {
        return sql`
          SELECT
            offer_id,
            user_public_key
          FROM
            club_offer_reported_by
          WHERE
            ${sql.or(Array.map(query, (offerId) => sql`offer_id = ${offerId}`))}
        `
      },
    })
  )

  return flow(
    ListUserIds.execute,
    Effect.map(Array.map((a) => a.userPublicKey)),
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying user ids for reported club offer', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
