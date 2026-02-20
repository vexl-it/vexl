import {type MyOfferInState} from '@vexl-next/domain/src/general/offers'
import updateOwnerPrivatePayload from '@vexl-next/resources-utils/src/offers/updateOwnerPrivatePayload'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {type SessionV2} from '../../../brands/Session.brand'
import {ignoreReportErrors} from '../../../utils/reportError'
import {myOffersAtom} from '../../marketplace/atoms/myOffers'

const updateOffer = ({
  offer,
  offerApi,
  session,
}: {
  offer: MyOfferInState
  offerApi: OfferApi
  session: SessionV2
}): Effect.Effect<void> =>
  Effect.gen(function* (_) {
    // Upload new private payload with V2 keys
    yield* updateOwnerPrivatePayload({
      api: offerApi,
      ownerCredentials: session.privateKey,
      ownerKeyPairV2: session.keyPairV2,
      adminId: offer.ownershipInfo.adminId,
      intendedConnectionLevel: offer.ownershipInfo.intendedConnectionLevel,
      intendedClubs: offer.ownershipInfo.intendedClubs ?? [],
      symmetricKey: offer.offerInfo.privatePart.symmetricKey,
    })

    // Delete the old private part encrypted with V1 keys
    offerApi.deletePrivatePart({
      adminIds: [offer.ownershipInfo.adminId],
      publicKeys: [session.privateKey.publicKeyPemBase64],
    })
  }).pipe(
    ignoreReportErrors(
      'error',
      'Error migrating offer private payload to V2 keys'
    )
  )

export const migrateOwnerPrivatePartsToV2Keys = ({
  session,
  offerApi,
}: {
  session: SessionV2
  offerApi: OfferApi
}): Effect.Effect<void> =>
  Effect.gen(function* (_) {
    const myOffers = getDefaultStore().get(myOffersAtom)
    yield* Effect.all(
      Array.map(myOffers, (offer) => updateOffer({offer, offerApi, session}))
    )
  })
