import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {
  disableNearbySharing,
  enableNearbySharing,
} from '@vexl-next/resources-utils/src/offers/nearby/nearbySharing'
import {Array, Effect} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../../api'
import {myOffersAtom} from '../myOffers'

export const toggleNearbySharingActionAtom = atom(
  null,
  (get, set, {offerId, enabled}: {offerId: OfferId; enabled: boolean}) =>
    Effect.gen(function* (_) {
      const offerApi = get(apiAtom).offer
      const offer = yield* _(
        Array.findFirst(
          get(myOffersAtom),
          (one) => one.offerInfo.offerId === offerId
        )
      )
      const {adminId, nearbyKey: currentNearbyKey} = offer.ownershipInfo
      if (enabled === !!currentNearbyKey) return

      const nearbyKey = currentNearbyKey
        ? yield* _(
            disableNearbySharing({
              offerApi,
              adminId,
              nearbyKey: currentNearbyKey,
            }),
            Effect.as(undefined)
          )
        : yield* _(
            enableNearbySharing({
              offerApi,
              adminId,
              symmetricKey: offer.offerInfo.privatePart.symmetricKey,
            })
          )

      set(
        myOffersAtom,
        Array.map((one) =>
          one.offerInfo.offerId === offerId
            ? {...one, ownershipInfo: {...one.ownershipInfo, nearbyKey}}
            : one
        )
      )
    })
)
