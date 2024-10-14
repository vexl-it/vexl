import {Schema} from '@effect/schema'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {OfferIdE} from '@vexl-next/domain/src/general/offers'
import {Effect} from 'effect'
import {OfferAdminIdHashed} from '../domain'

export const UpdateOfferPublicPayloadModifiedNowRequest = Schema.Struct({
  offerId: OfferIdE,
  adminId: OfferAdminIdHashed,
})
export type UpdateOfferPublicPayloadModifiedNowRequest = Schema.Schema.Type<
  typeof UpdateOfferPublicPayloadModifiedNowRequest
>

export const createUpdateOfferPublicPayloadModifiedNow = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    return (req: UpdateOfferPublicPayloadModifiedNowRequest) =>
      sql`
        UPDATE offer_public
        SET
          modified_at = now()
        WHERE
          ${sql.and([
          sql`offer_id = ${req.offerId}`,
          sql`admin_id = ${req.adminId}`,
        ])}
      `.pipe(
        Effect.catchAll((e) =>
          Effect.zipRight(
            Effect.logError('Error updaing public payload modified now', e),
            Effect.fail(new UnexpectedServerError({status: 500}))
          )
        )
      )
  }
)
