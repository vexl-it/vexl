import {Schema} from '@effect/schema'
import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  newOfferId,
  OfferIdE,
  OfferTypeE,
  PublicPayloadEncryptedE,
} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, flow} from 'effect'
import {OfferAdminIdHashed, PublicPartRecord} from '../domain'

export const InsertPublicPartRequest = Schema.Struct({
  adminId: OfferAdminIdHashed,
  offerId: OfferIdE,
  offerType: OfferTypeE,
  payloadPublic: PublicPayloadEncryptedE,
  countryPrefix: CountryPrefixE,
})
export type InsertPublicPartRequest = Schema.Schema.Type<
  typeof InsertPublicPartRequest
>

export const createInsertPublicPart = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const InsertPublicPart = yield* _(
    SqlResolver.ordered('InsertPublicPart', {
      Request: InsertPublicPartRequest,
      Result: PublicPartRecord,
      execute: (requests) => {
        const requestsWithAutoValues = Array.map(requests, (oneRequest) => ({
          ...oneRequest,
          adminId: oneRequest.adminId,
          offerId: oneRequest.offerId ?? newOfferId(),
          createdAt: new Date(),
          modifiedAt: new Date(),
          report: 0,
          refreshedAt: new Date(),
        }))
        return sql`
          INSERT INTO
            offer_public ${sql.insert(requestsWithAutoValues)}
          RETURNING
            *
        `
      },
    })
  )

  return flow(
    InsertPublicPart.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        // TODO find out if offer already exists and throw appropriatte error (with that id)
        Effect.logError('Error inserting offer public part', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    )
  )
})
