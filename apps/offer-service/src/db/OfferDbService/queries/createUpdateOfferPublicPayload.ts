import {Schema} from '@effect/schema'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  OfferIdE,
  PublicPayloadEncryptedE,
} from '@vexl-next/domain/src/general/offers'
import {Effect} from 'effect'
import {OfferAdminIdHashed} from '../domain'

export const UpdateOfferPublicPayloadRequest = Schema.Struct({
  offerId: OfferIdE,
  adminId: OfferAdminIdHashed,
  payloadPublic: PublicPayloadEncryptedE,
})
export type UpdateOfferPublicPayloadRequest = Schema.Schema.Type<
  typeof UpdateOfferPublicPayloadRequest
>

export const createUpdateOfferPublicPayload = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  return (req: UpdateOfferPublicPayloadRequest) =>
    sql`
      UPDATE offer_public
      SET
        payload_public = ${req.payloadPublic},
        modified_at = now()
      WHERE
        ${sql.and([
        sql`offer_id = ${req.offerId}`,
        sql`admin_id = ${req.adminId}`,
      ])}
    `.pipe(
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error updaing public payload', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      )
    )
})
