import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {newOfferId} from '@vexl-next/domain/src/general/offers'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {reportOfferCreated} from '../metrics'
import {hashAdminId} from '../utils/hashAdminId'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {validatePrivatePartsWhenSavingAll} from '../utils/validatePrivatePartsWhenSavingAll'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const createNewOffer = HttpApiBuilder.handler(
  OfferApiSpecification,
  'root',
  'createNewOffer',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const offerDb = yield* _(OfferDbService)

      const hashedAdminId = yield* _(hashAdminId(req.payload.adminId))

      const insertedOffer = yield* _(
        offerDb.insertPublicPart({
          adminId: hashedAdminId,
          countryPrefix: req.payload.countryPrefix,
          offerId: req.payload.offerId ?? newOfferId(),
          offerType: req.payload.offerType,
          payloadPublic: req.payload.payloadPublic,
        })
      )

      yield* _(
        validatePrivatePartsWhenSavingAll({
          ownersPublicKey: security['public-key'],
          privateParts: req.payload.offerPrivateList,
        })
      )

      yield* _(
        Effect.forEach(
          req.payload.offerPrivateList,
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
        Effect.map((o) => ({...o, adminId: req.payload.adminId}))
      )
    }).pipe(
      withDbTransaction,
      withOfferAdminActionRedisLock(req.payload.adminId),
      Effect.withSpan('createNewOffer'),
      Effect.zipLeft(reportOfferCreated(req.payload.countryPrefix)),
      makeEndpointEffect
    )
)
