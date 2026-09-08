import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {newOfferId} from '@vexl-next/domain/src/general/offers'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect, Option, pipe} from 'effect'
import {OfferDbService} from '../db/OfferDbService'
import {reportOfferCreated} from '../metrics'
import {hashAdminId} from '../utils/hashAdminId'
import {offerPartsToServerOffer} from '../utils/offerPartsToServerOffer'
import {validatePrivatePartsWhenSavingAll} from '../utils/validatePrivatePartsWhenSavingAll'
import {withOfferAdminActionRedisLock} from '../utils/withOfferAdminRedisLock'

export const createNewOffer = makeHttpApiHandler(
  OfferApiSpecification,
  'root',
  'createNewOffer',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const offerDb = yield* OfferDbService

      const hashedAdminId = yield* hashAdminId(req.payload.adminId)

      const insertedOffer = yield* offerDb.insertPublicPart({
        adminId: hashedAdminId,
        countryPrefix: req.payload.countryPrefix,
        offerId: req.payload.offerId ?? newOfferId(),
        offerType: req.payload.offerType,
        payloadPublic: req.payload.payloadPublic,
      })

      yield* validatePrivatePartsWhenSavingAll({
        ownersPublicKey: Option.getOrElse(
          security.publicKeyV2,
          () => security.publicKey
        ),
        privateParts: req.payload.offerPrivateList,
      })

      yield* Effect.forEach(
        req.payload.offerPrivateList,
        (privatePart) =>
          offerDb.insertOfferPrivatePart({
            ...privatePart,
            offerId: insertedOffer.id,
          }),
        {}
      )

      return yield* pipe(
        offerDb.queryOfferByPublicKeyAndOfferId({
          id: insertedOffer.offerId,
          userPublicKey: security.publicKey,
          userPublicKeyV2: security.publicKeyV2,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', () =>
          Effect.andThen(
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
      Effect.tap(
        reportOfferCreated({
          countryPrefix: req.payload.countryPrefix,
          offerType: req.payload.offerType,
          commonMetricAttributes: commonMetricAttributesFromHeaders(
            req.headers
          ),
        })
      ),
      makeEndpointEffect
    )
)
