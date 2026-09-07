import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Schema} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {PublicPartId} from '../domain'

export const DeletePrivatePartRequest = Schema.Struct({
  forPublicKey: Schema.Union([PublicKeyPemBase64, PublicKeyV2]),
  offerId: PublicPartId,
})
export type DeletePrivatePartRequest = typeof DeletePrivatePartRequest.Type

export const createDeletePrivatePart = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const DeletePrivatePart = SqlResolver.void({
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
  return flow(
    SqlResolver.request(DeletePrivatePart),
    UnexpectedServerError.wrapErrors('Error deleting private part')
  )
})
