import {Schema} from '@effect/schema'
import {DeleteOfferEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {reportOfferPublicPartDeleted} from '../metrics'
import {hashAdminId} from '../utils/hashAdminId'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const deleteOffer = Handler.make(DeleteOfferEndpoint, (req, security) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const dbService = yield* _(OfferDbService)
      const hashedAdminId = yield* _(
        Effect.forEach(req.query.adminIds, hashAdminId)
      )

      yield* _(
        Effect.forEach(
          hashedAdminId,
          dbService.deleteAllPrivatePartsForAdminId,
          {
            batching: true,
          }
        )
      )
      yield* _(
        Effect.forEach(hashedAdminId, dbService.deletePublicPart, {
          batching: true,
        })
      )

      yield* _(reportOfferPublicPartDeleted())

      return null
    }).pipe(
      withDbTransaction,
      withOfferAdminActionRedisLock([...req.query.adminIds])
    ),
    Schema.Void
  )
)
