import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferIdE} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Schema} from 'effect'

export const InsertClubOfferReportedByRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64E,
  offerId: OfferIdE,
})

export type InsertClubOfferReportedByRequest =
  typeof InsertClubOfferReportedByRequest.Type

export const createInsertClubOfferReportedBy = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const InsertClubOfferReportedBy = yield* _(
    SqlResolver.void('InsertClubOfferReportedBy', {
      Request: InsertClubOfferReportedByRequest,
      execute: (request) => {
        return sql`
          INSERT INTO
            club_offer_reported_by ${sql.insert(request)}
          RETURNING
            club_offer_reported_by.*
        `
      },
    })
  )

  return flow(
    InsertClubOfferReportedBy.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error inserting club offer reported by', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
