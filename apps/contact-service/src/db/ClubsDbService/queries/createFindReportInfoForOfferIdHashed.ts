import {PgClient} from '@effect/sql-pg'
import {OfferIdHashed} from '@vexl-next/domain/src/general/clubs'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ClubOfferReporedInfoRecord} from '../domain'

export const createFindReportInfoForOfferIdHashed = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOneOption({
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
    UnexpectedServerError.wrapErrors(
      'Error querying info for reported club offer'
    )
  )
})
