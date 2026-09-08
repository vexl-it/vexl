import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {OfferAdminIdHashed} from '../domain'

const DeletePublicPartRequest = OfferAdminIdHashed
export type DeletePublicPartRequest = typeof DeletePublicPartRequest.Type
export const createDeletePublicPart = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const DeletePublicPart = SqlResolver.void({
    Request: DeletePublicPartRequest,
    execute: (req) => sql`
      DELETE FROM offer_public
      WHERE
        ${sql.in('admin_id', req)}
    `,
  })
  return flow(
    SqlResolver.request(DeletePublicPart),
    UnexpectedServerError.wrapErrors('Error deleting public part')
  )
})
