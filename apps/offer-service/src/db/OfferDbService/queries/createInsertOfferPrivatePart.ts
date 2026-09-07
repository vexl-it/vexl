import {PgClient} from '@effect/sql-pg'
import {PublicKeyV2} from '@vexl-next/cryptography'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePayloadEncrypted} from '@vexl-next/domain/src/general/offers'
import {Effect, flow, Schema} from 'effect'
import {SqlResolver} from 'effect/unstable/sql'
import {PublicPartId} from '../domain'

export const InsertOfferPrivatePartRequest = Schema.Struct({
  userPublicKey: Schema.Union([PublicKeyPemBase64, PublicKeyV2]),
  payloadPrivate: PrivatePayloadEncrypted,
  offerId: PublicPartId,
})

export type InsertOfferPrivatePartRequest =
  typeof InsertOfferPrivatePartRequest.Type

export const createInsertOfferPrivatePart = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const InsertOfferPrivateParts = SqlResolver.void({
    Request: InsertOfferPrivatePartRequest,
    execute: (requests) => {
      return sql`
        INSERT INTO
          offer_private ${sql.insert(requests)}
        RETURNING
          offer_private.*
      `
    },
  })

  return flow(
    SqlResolver.request(InsertOfferPrivateParts),
    UnexpectedServerError.wrapErrors('Error inserting offer private part')
  )
})
