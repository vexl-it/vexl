import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, RequestResolver, Schema} from 'effect'
import {PublicPartId} from '../domain'

export const DeletePrivatePartRequest = Schema.Struct({
  forPublicKey: Schema.Union(PublicKeyPemBase64, PublicKeyV2),
  offerId: PublicPartId,
})
export type DeletePrivatePartRequest = typeof DeletePrivatePartRequest.Type

// Each request binds 2 parameters and postgres allows at most 65,535 per statement
const MAX_REQUESTS_PER_STATEMENT = 10_000

export const createDeletePrivatePart = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const DeletePrivatePart = yield* _(
    SqlResolver.void('DeletePrivatePart', {
      Request: DeletePrivatePartRequest,
      execute: (req) => sql`
        DELETE FROM offer_private
        WHERE
          ${sql.or(
          req.map((one) =>
            sql.and([
              sql`offer_id = ${one.offerId}`,
              sql`user_public_key = ${one.forPublicKey}`,
            ])
          )
        )}
      `,
    })
  )
  return flow(
    DeletePrivatePart.makeExecute(
      RequestResolver.batchN(DeletePrivatePart, MAX_REQUESTS_PER_STATEMENT)
    ),
    UnexpectedServerError.wrapErrors('Error deleting private part')
  )
})
