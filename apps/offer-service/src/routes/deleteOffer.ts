import {HttpApiBuilder} from '@effect/platform/index'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {reportOfferPublicPartDeleted} from '../metrics'
import {hashAdminId} from '../utils/hashAdminId'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const deleteOffer = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'deleteOffer',
  (req) =>
    Effect.gen(function* (_) {
      const dbService = yield* _(OfferDbService)
      const hashedAdminId = yield* _(
        Effect.forEach(req.urlParams.adminIds, hashAdminId)
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

      return {}
    }).pipe(
      withDbTransaction,
      withOfferAdminActionRedisLock([...req.urlParams.adminIds]),
      makeEndpointEffect
    )
)
