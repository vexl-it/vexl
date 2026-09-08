import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect} from 'effect'
import {OfferDbService} from '../db/OfferDbService'

export const getRemovedOffers = makeHttpApiHandler(
  OfferApiSpecification,
  'root',
  'getRemovedOffers',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const offerDbService = yield* OfferDbService

      const existingIds = yield* offerDbService.queryOffersIds({
        userPublicKey: security.publicKey,
        userPublicKeyV2: security.publicKeyV2,
      })

      const nonExistingIds = Array.filter(
        req.payload.offerIds,
        (id) => !Array.contains(existingIds, id)
      )

      return {offerIds: nonExistingIds}
    }).pipe(makeEndpointEffect)
)
