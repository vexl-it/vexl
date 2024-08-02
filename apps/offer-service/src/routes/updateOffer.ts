import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  UpdateOfferEndpoint,
  UpdateOfferErrors,
} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Metric} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {offerModifiedCounter} from '../metrics'
import {hashAdminId} from '../utils/hashAdminId'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {validatePrivatePartsWhenSavingAll} from '../utils/validatePrivatePartsWhenSavingAll'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const updateOffer = Handler.make(UpdateOfferEndpoint, (req, security) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      const offerDb = yield* _(OfferDbService)

      const adminIdHashed = yield* _(hashAdminId(req.body.adminId))
      const publicPartFromDb = yield* _(
        offerDb.queryPublicPartByAdminId(adminIdHashed),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', (e) =>
          Effect.fail(new NotFoundError())
        )
      )

      if (Array.isNonEmptyReadonlyArray(req.body.offerPrivateList)) {
        yield* _(
          validatePrivatePartsWhenSavingAll({
            privateParts: req.body.offerPrivateList,
            ownersPublicKey: security['public-key'],
          })
        )

        yield* _(offerDb.deleteAllPrivatePartsForAdminId(adminIdHashed))
        yield* _(
          Effect.forEach(
            req.body.offerPrivateList,
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
          payloadPublic: req.body.payloadPublic,
        })
      )

      return yield* _(
        offerDb.queryOfferByPublicKeyAndOfferId({
          id: publicPartFromDb.offerId,
          userPublicKey: security['public-key'],
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
      withOfferAdminActionRedisLock(security['public-key']),
      Effect.zipLeft(Metric.increment(offerModifiedCounter))
    ),
    UpdateOfferErrors
  )
)
