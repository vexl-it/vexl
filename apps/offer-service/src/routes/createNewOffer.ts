import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {newOfferId} from '@vexl-next/domain/src/general/offers'
import {CreateNewOfferErrors} from '@vexl-next/rest-api/src/services/offer/contracts'
import {CreateNewOfferEndpoint} from '@vexl-next/rest-api/src/services/offer/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {OfferDbService} from '../db/OfferDbService'
import {reportOfferCreated} from '../metrics'
import {hashAdminId} from '../utils/hashAdminId'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {validatePrivatePartsWhenSavingAll} from '../utils/validatePrivatePartsWhenSavingAll'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const createNewOffer = Handler.make(
  CreateNewOfferEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const offerDb = yield* _(OfferDbService)

        const hashedAdminId = yield* _(hashAdminId(req.body.adminId))

        const insertedOffer = yield* _(
          offerDb.insertPublicPart({
            adminId: hashedAdminId,
            countryPrefix: req.body.countryPrefix,
            offerId: req.body.offerId ?? newOfferId(),
            offerType: req.body.offerType,
            payloadPublic: req.body.payloadPublic,
          })
        )

        yield* _(
          validatePrivatePartsWhenSavingAll({
            ownersPublicKey: security['public-key'],
            privateParts: req.body.offerPrivateList,
          })
        )

        yield* _(
          Effect.forEach(
            req.body.offerPrivateList,
            (privatePart) =>
              offerDb.insertOfferPrivatePart({
                ...privatePart,
                offerId: insertedOffer.id,
              }),
            {batching: true}
          )
        )

        return yield* _(
          offerDb.queryOfferByPublicKeyAndOfferId({
            id: insertedOffer.offerId,
            userPublicKey: security['public-key'],
          }),
          Effect.flatten,
          Effect.catchTag('NoSuchElementException', () =>
            Effect.zipRight(
              Effect.logError(
                'Error finding offer in the database right after creating it. This should not happen.'
              ),
              Effect.fail(new UnexpectedServerError({status: 500}))
            )
          ),
          Effect.map(offerPartsToServerOffer),
          Effect.map((o) => ({...o, adminId: req.body.adminId}))
        )
      }).pipe(
        withDbTransaction,
        withOfferAdminActionRedisLock(req.body.adminId),
        Effect.withSpan('createNewOffer'),
        Effect.zipLeft(reportOfferCreated(req.body.countryPrefix))
      ),
      CreateNewOfferErrors
    )
)
