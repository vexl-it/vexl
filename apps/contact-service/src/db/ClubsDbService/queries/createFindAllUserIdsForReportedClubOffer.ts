import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferIdE} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, flow, Schema} from 'effect'

export const createFindAllUserIdsForReportedClubOffer = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: OfferIdE,
      Result: Schema.Struct({
        userPublicKey: PublicKeyPemBase64E,
      }),
      execute: (offerId) => sql`
        SELECT
          user_public_key
        FROM
          club_offer_reported_by
        WHERE
          offer_id = ${offerId}
      `,
    })

    return flow(
      query,
      Effect.map(Array.map((entry) => entry.userPublicKey)),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error querying user ids for reported club offer', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
  }
)
