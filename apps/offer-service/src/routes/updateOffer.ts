import {HttpApiBuilder} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {reportOfferModified} from '../metrics'
import {hashAdminId} from '../utils/hashAdminId'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {validatePrivatePartsWhenSavingAll} from '../utils/validatePrivatePartsWhenSavingAll'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const updateOffer = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'updateOffer',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const offerDb = yield* _(OfferDbService)

      const adminIdHashed = yield* _(hashAdminId(req.payload.adminId))
      const publicPartFromDb = yield* _(
        offerDb.queryPublicPartByAdminId(adminIdHashed),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', (e) =>
          Effect.fail(new NotFoundError())
        )
      )

      if (Array.isNonEmptyReadonlyArray(req.payload.offerPrivateList)) {
        yield* _(
          validatePrivatePartsWhenSavingAll({
            privateParts: req.payload.offerPrivateList,
            ownersPublicKey: security['public-key'],
          })
        )

        yield* _(offerDb.deleteAllPrivatePartsForAdminId(adminIdHashed))
        yield* _(
          Effect.forEach(
            req.payload.offerPrivateList,
            (privatePart) =>
              offerDb.insertOfferPrivatePart({
                ...privatePart,
                offerId: publicPartFromDb.id,
              }),
            {batching: true}
          )
        )
      }

      yield* _(
        offerDb.updateOfferPublicPayload({
          adminId: adminIdHashed,
          offerId: publicPartFromDb.offerId,
          payloadPublic: req.payload.payloadPublic,
        })
      )

      return yield* _(
        offerDb.queryOfferByPublicKeyAndOfferId({
          id: publicPartFromDb.offerId,
          userPublicKey: security['public-key'],
          skipValidation: true,
        }),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', () =>
          Effect.zipRight(
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
      Effect.zipLeft(reportOfferModified()),
      makeEndpointEffect
    )
)
