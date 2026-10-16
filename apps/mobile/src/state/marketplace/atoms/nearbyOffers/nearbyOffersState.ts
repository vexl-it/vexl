import {
  type MyOfferInState,
  NearbyOfferKey,
  OfferId,
  type OfferInfo,
} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {fetchNearbyOffer} from '@vexl-next/resources-utils/src/offers/nearby/fetchNearbyOffer'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Equivalence, Option, pipe, Schema} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {selectAtom} from 'jotai/utils'
import {atomWithParsedMmkvStorage} from '../../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {myOffersAtom} from '../myOffers'

const ReceivedNearbyOfferKey = Schema.Struct({
  key: NearbyOfferKey,
  lastSeenAt: UnixMilliseconds,
})

const NearbyOffersState = Schema.Struct({
  keysByOfferId: Schema.Record({key: OfferId, value: ReceivedNearbyOfferKey}),
})

export const nearbyOffersStateAtom = atomWithParsedMmkvStorage(
  'nearbyOffers',
  {keysByOfferId: {}},
  NearbyOffersState
)

export const receivedNearbyKeysByOfferIdAtom = focusAtom(
  nearbyOffersStateAtom,
  (o) => o.prop('keysByOfferId')
)

const nearbyKeysOfOffers = (
  offers: readonly MyOfferInState[]
): readonly NearbyOfferKey[] =>
  Array.filterMap(offers, (offer) =>
    Option.fromNullable(offer.ownershipInfo.nearbyKey)
  )

export const myNearbyKeysAtom = atom((get) =>
  nearbyKeysOfOffers(get(myOffersAtom))
)

// Paused offers are not advertised so the phone is not a beacon for nothing.
// Selected with equality so the native module is only called on real changes.
export const myAdvertisedNearbyKeysAtom = selectAtom(
  myOffersAtom,
  (offers) =>
    nearbyKeysOfOffers(
      Array.filter(offers, (offer) => offer.offerInfo.publicPart.active)
    ),
  Array.getEquivalence(Equivalence.string)
)

export interface FetchedNearbyOffer {
  readonly key: NearbyOfferKey
  readonly offerInfo: OfferInfo
}

// Keys come from untrusted peers or may be already unshared, so a failing key
// is expected and must not fail the others.
export function fetchNearbyOffers({
  offerApi,
  keys,
}: {
  offerApi: OfferApi
  keys: readonly NearbyOfferKey[]
}): Effect.Effect<readonly FetchedNearbyOffer[]> {
  return pipe(
    keys,
    Effect.forEach(
      (nearbyKey) =>
        fetchNearbyOffer({offerApi, nearbyKey}).pipe(
          Effect.map((offerInfo) => ({key: nearbyKey, offerInfo})),
          Effect.tapError((e) =>
            Effect.sync(() => {
              console.log(`Unable to fetch nearby offer: ${e._tag}`)
            })
          ),
          Effect.option
        ),
      {concurrency: 3}
    ),
    Effect.map(Array.getSomes)
  )
}
