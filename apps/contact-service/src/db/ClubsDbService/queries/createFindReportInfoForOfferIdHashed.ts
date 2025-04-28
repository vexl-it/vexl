import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {OfferIdHashed} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {ClubOfferReporedInfoRecord} from '../domain'

export const createFindReportInfoForOfferIdHashed = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findOne({
    Request: OfferIdHashed,
    Result: ClubOfferReporedInfoRecord,
    execute: (offerIdHashed) => sql`
      SELECT
        *
      FROM
        club_offer_reported_info
      WHERE
        offer_id = ${offerIdHashed}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error querying info for reported club offer', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
