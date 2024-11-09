import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'
import {OfferAdminIdHashed} from '../domain'

const DeletePublicPartRequest = OfferAdminIdHashed
export type DeletePublicPartRequest = typeof DeletePublicPartRequest.Type
export const createDeletePublicPart = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const DeletePublicPart = yield* _(
    SqlResolver.void('DeletePublicPart', {
      Request: DeletePublicPartRequest,
      execute: (req) => sql`
        DELETE FROM offer_public
        WHERE
          ${sql.in('admin_id', req)}
      `,
    })
  )
  return flow(
    DeletePublicPart.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error deleting public part', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
