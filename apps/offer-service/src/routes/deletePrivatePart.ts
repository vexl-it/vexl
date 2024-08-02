import {CanNotDeletePrivatePartOfAuthor} from '@vexl-next/rest-api/src/services/offer/contracts'
import {
  DeletePrivatePartEndpoint,
  DeletePrivatePartErrors,
} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, flow, Option, pipe} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {hashAdminId} from '../utils/hashAdminId'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const deletePrivatePart = Handler.make(
  DeletePrivatePartEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const offerDbService = yield* _(OfferDbService)

        if (Array.contains(req.body.publicKeys, security['public-key'])) {
          return yield* _(
            Effect.fail(
              new CanNotDeletePrivatePartOfAuthor({
                status: 400,
              })
            )
          )
        }

        const hashedAdminIds = yield* _(
          Effect.forEach(req.body.adminIds, hashAdminId)
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
            Array.map(req.body.publicKeys, (pubKey) => ({
              forPublicKey: pubKey,
              offerId: offer.id,
            }))
          ),
          Array.flatten
        )

        yield* _(
          Effect.forEach(
            combinationsToDelete,
            offerDbService.deletePrivatePart,
            {
              batching: true,
            }
          )
        )
        return null
      }).pipe(
        withDbTransaction,
        withOfferAdminActionRedisLock(security['public-key']),
        withDbTransaction
      ),
      DeletePrivatePartErrors
    )
)
