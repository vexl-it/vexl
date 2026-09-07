import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, pipe} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {reportOfferModified} from '../metrics'
import {hashAdminId} from '../utils/hashAdminId'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {validatePrivatePartsWhenSavingAll} from '../utils/validatePrivatePartsWhenSavingAll'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const updateOffer = makeHttpApiHandler(
  OfferApiSpecification,
  'root',
  'updateOffer',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const offerDb = yield* OfferDbService

      const adminIdHashed = yield* hashAdminId(req.payload.adminId)
      const publicPartFromDb = yield* pipe(
        offerDb.queryPublicPartByAdminId(adminIdHashed),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', (e) =>
          Effect.fail(new NotFoundError())
        )
      )

      if (Array.isReadonlyArrayNonEmpty(req.payload.offerPrivateList)) {
        yield* validatePrivatePartsWhenSavingAll({
          privateParts: req.payload.offerPrivateList,
          ownersPublicKey: security.publicKey,
        })

        yield* offerDb.deleteAllPrivatePartsForAdminId(adminIdHashed)
        yield* Effect.forEach(
          req.payload.offerPrivateList,
          (privatePart) =>
            offerDb.insertOfferPrivatePart({
              ...privatePart,
              offerId: publicPartFromDb.id,
            }),
          {}
        )
      }

      yield* offerDb.updateOfferPublicPayload({
        adminId: adminIdHashed,
        offerId: publicPartFromDb.offerId,
        payloadPublic: req.payload.payloadPublic,
      })

      return yield* pipe(
        offerDb.queryOfferByPublicKeyAndOfferId({
          id: publicPartFromDb.offerId,
          userPublicKey: security.publicKey,
          userPublicKeyV2: security.publicKeyV2,
          skipValidation: true,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', () =>
          Effect.andThen(
            Effect.logError(
              'Error finding offer in the database right after updating it. This should not happen.'
            ),
            Effect.fail(new UnexpectedServerError({status: 500}))
          )
        ),
        Effect.map(offerPartsToServerOffer)
      )
    }).pipe(
      withDbTransaction,
      withOfferAdminActionRedisLock(req.payload.adminId),
      Effect.tap(
        reportOfferModified(commonMetricAttributesFromHeaders(req.headers))
      ),
      makeEndpointEffect
    )
)
