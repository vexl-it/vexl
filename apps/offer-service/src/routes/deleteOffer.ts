import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {reportOfferPublicPartDeleted} from '../metrics'
import {hashAdminId} from '../utils/hashAdminId'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const deleteOffer = makeHttpApiHandler(
  OfferApiSpecification,
  'root',
  'deleteOffer',
  (req) =>
    Effect.gen(function* () {
      const dbService = yield* OfferDbService
      const hashedAdminId = yield* Effect.forEach(
        req.query.adminIds,
        hashAdminId
      )

      yield* Effect.forEach(
        hashedAdminId,
        dbService.deleteAllPrivatePartsForAdminId,
        {}
      )
      yield* Effect.forEach(hashedAdminId, dbService.deletePublicPart, {})

      yield* reportOfferPublicPartDeleted(
        commonMetricAttributesFromHeaders(req.headers)
      )

      return {}
    }).pipe(
      withDbTransaction,
      withOfferAdminActionRedisLock([...req.query.adminIds]),
      makeEndpointEffect
    )
)
