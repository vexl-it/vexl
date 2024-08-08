import {Schema} from '@effect/schema'
import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {PrivatePayloadEncryptedE} from '@vexl-next/domain/src/general/offers'
import {Effect, flow} from 'effect'
import {PublicPartId} from '../domain'

export const InsertOfferPrivatePartRequest = Schema.Struct({
  userPublicKey: PublicKeyPemBase64E,
  payloadPrivate: PrivatePayloadEncryptedE,
  offerId: PublicPartId,
})

export type InsertOfferPrivatePartRequest = Schema.Schema.Type<
  typeof InsertOfferPrivatePartRequest
>

export const createInsertOfferPrivatePart = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const InsertOfferPrivateParts = yield* _(
    SqlResolver.void('InsertOfferPrivatePart', {
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
  )

  return flow(
    InsertOfferPrivateParts.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error inserting offer private part', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
