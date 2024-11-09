import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, type Schema} from 'effect'
import {OfferAdminIdHashed} from '../domain'

const DeleteAllPrivatePartsForAdminIdRequest = OfferAdminIdHashed
export type DeleteAllPrivatePartsForAdminIdRequest = Schema.Schema.Type<
  typeof DeleteAllPrivatePartsForAdminIdRequest
>

export const createDeleteAllPrivatePartsForAdminId = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const createDeleteAllPrivatePartsForAdminId = yield* _(
    SqlResolver.void('createDeleteAllPrivatePartsForAdminId', {
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
  )

  return flow(
    createDeleteAllPrivatePartsForAdminId.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error deleting all private parts', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
