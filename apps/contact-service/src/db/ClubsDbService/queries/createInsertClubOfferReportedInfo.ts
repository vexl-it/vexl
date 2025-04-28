import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {ClubUuidE, OfferIdHashed} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'

export const InsertClubOfferReportedInfoRequest = Schema.Struct({
  offerId: OfferIdHashed,
  clubUuid: ClubUuidE,
  reportedAt: Schema.DateFromSelf,
})

export type InsertClubOfferReportedInfoRequest =
  typeof InsertClubOfferReportedInfoRequest.Type

export const createInsertClubOfferReportedInfo = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: InsertClubOfferReportedInfoRequest,
    execute: (params) => sql`
      INSERT INTO
        club_offer_reported_info ${sql.insert(params)}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error inserting club offer reported by', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
