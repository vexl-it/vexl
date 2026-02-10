import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {CanNotDeletePrivatePartOfAuthor} from '@vexl-next/rest-api/src/services/offer/contracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option, flow, pipe} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {hashAdminId} from '../utils/hashAdminId'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const deletePrivatePart = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'deletePrivatePart',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const offerDbService = yield* _(OfferDbService)

      if (Array.contains(req.payload.publicKeys, security.publicKey)) {
        return yield* _(
          Effect.fail(
            new CanNotDeletePrivatePartOfAuthor({
              status: 400,
            })
          )
        )
      }

      const hashedAdminIds = yield* _(
        Effect.forEach(req.payload.adminIds, hashAdminId)
      )

      const offers = yield* _(
        Effect.forEach(
          hashedAdminIds,
          offerDbService.queryPublicPartByAdminId,
          {
            batching: true,
          }
        ),
        Effect.map(
          flow(
            Array.filter(Option.isSome),
            Array.map((a) => a.value)
          )
        )
      )

      const combinationsToDelete = pipe(
        Array.map(offers, (offer) =>
          Array.map(req.payload.publicKeys, (pubKey) => ({
            forPublicKey: pubKey,
            offerId: offer.id,
          }))
        ),
        Array.flatten
      )

      yield* _(
        Effect.forEach(combinationsToDelete, offerDbService.deletePrivatePart, {
          batching: true,
        })
      )
      return {}
    }).pipe(
      withDbTransaction,
      withOfferAdminActionRedisLock([...req.payload.adminIds]),
      makeEndpointEffect
    )
)
