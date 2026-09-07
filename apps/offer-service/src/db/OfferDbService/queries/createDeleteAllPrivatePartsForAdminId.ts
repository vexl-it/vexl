import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {OfferAdminIdHashed} from '../domain'

const DeleteAllPrivatePartsForAdminIdRequest = OfferAdminIdHashed
export type DeleteAllPrivatePartsForAdminIdRequest =
  typeof DeleteAllPrivatePartsForAdminIdRequest.Type

export const createDeleteAllPrivatePartsForAdminId = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const createDeleteAllPrivatePartsForAdminId = SqlResolver.void({
    Request: DeleteAllPrivatePartsForAdminIdRequest,
    execute: (req) => sql`
      DELETE FROM offer_private USING offer_public
      WHERE
        ${sql.and([
        `offer_private.offer_id = offer_public.id`,
        sql.in('offer_public.admin_id', req),
      ])}
    `,
  })

  return flow(
    SqlResolver.request(createDeleteAllPrivatePartsForAdminId),
    UnexpectedServerError.wrapErrors('Error deleting all private parts')
  )
})
