import {type Atom, atom, type SetStateAction, type WritableAtom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {
  type LoadingState,
  type OffersFilter,
  OffersState,
  type OneOfferInState,
} from './domain'
import {
  type OfferFlags,
  type OfferId,
  type Sort,
} from '@vexl-next/domain/dist/general/offers'
import {MINIMAL_DATE} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import areIncluded from './utils/areIncluded'
import {type ChatOrigin} from '@vexl-next/domain/dist/general/messaging'
import {type FocusAtomType} from '../../utils/atomUtils/FocusAtomType'
import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {selectAtom, splitAtom} from 'jotai/utils'
import {importedContactsHashesAtom} from '../contacts'
import sortOffers from './utils/sortOffers'
import isSomeIn30KmRange from './utils/isIn30KmRadius'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

export const addMoreContactsSuggestionVisibleAtom = atom<boolean>(true)
export const resetFilterSuggestionVisibleAtom = atom<boolean>(true)

export const createOfferSuggestionVisibleStorageAtom =
  atomWithParsedMmkvStorage(
    'createOfferSuggestionVisible',
    {
      visible: true,
    },
    z.object({visible: z.boolean().default(true)})
  )

export const createOfferSuggestionVisibleAtom = focusAtom(
  createOfferSuggestionVisibleStorageAtom,
  (o) => o.prop('visible')
)

export const offersStateAtom = atomWithParsedMmkvStorage(
  'offers',
  {
    lastUpdatedAt: MINIMAL_DATE,
    offers: [] as OneOfferInState[],
  },
  OffersState
)
export const offersAtom = focusAtom(offersStateAtom, (optic) =>
  optic.prop('offers')
)

export const offersToSeeInMarketplaceAtom = atom((get) => {
  const importedContactsHashes = get(importedContactsHashesAtom)

  return get(offersAtom).filter(
    (oneOffer) =>
      // only active offers
      oneOffer.offerInfo.publicPart.active &&
      // Not mine offers
      !oneOffer.ownershipInfo &&
      // Not reported offers
      !oneOffer.flags.reported &&
      // Offers that has at least one common contact or are first degree
      (oneOffer.offerInfo.privatePart.commonFriends.some((one) =>
        importedContactsHashes.includes(one)
      ) ||
        oneOffer.offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE'))
  )
})

export const buyOffersToSeeInMarketplaceCountAtom = selectAtom(
  offersToSeeInMarketplaceAtom,
  (offers) =>
    offers.filter((offer) => offer.offerInfo.publicPart.offerType === 'BUY')
      .length
)

export const sellOffersToSeeInMarketplaceCountAtom = selectAtom(
  offersToSeeInMarketplaceAtom,
  (offers) =>
    offers.filter((offer) => offer.offerInfo.publicPart.offerType === 'SELL')
      .length
)

export const offersIdsAtom = focusAtom(offersAtom, (optic) =>
  optic.elems().prop('offerInfo').prop('offerId')
)

export const lastUpdatedAtAtom = focusAtom(offersStateAtom, (optic) =>
  optic.prop('lastUpdatedAt')
)

export const myOffersAtom = focusAtom(offersAtom, (optic) =>
  optic.filter((offer) => !!offer.ownershipInfo?.adminId)
)

export const myOffersSortedAtom = atom((get) => {
  const sortingOptions = get(selectedMyOffersSortingOptionAtom)
  const myOffers = get(myOffersAtom)

  return sortOffers(myOffers, sortingOptions)
})

export const myOffersSortedAtomsAtom = splitAtom(myOffersSortedAtom)

export const myActiveOffersAtom = focusAtom(myOffersAtom, (optic) =>
  optic.filter((myOffer) => myOffer.offerInfo.publicPart.active)
)

export const selectedMyOffersSortingOptionAtom = atom<Sort>('NEWEST_OFFER')

export function offersAtomWithFilter(
  filter: OffersFilter
): Atom<OneOfferInState[]> {
  return atom((get) => {
    const offersToSeeInMarketplace = get(offersToSeeInMarketplaceAtom)

    const filtered = offersToSeeInMarketplace.filter(
      (offer) =>
        (!filter.currency ||
          filter.currency.includes(offer.offerInfo.publicPart.currency)) &&
        (!filter.location ||
          filter.location.every((one) =>
            isSomeIn30KmRange(one, offer.offerInfo.publicPart.location)
          )) &&
        (!filter.paymentMethod ||
          areIncluded(
            filter.paymentMethod,
            offer.offerInfo.publicPart.paymentMethod
          )) &&
        (!filter.btcNetwork ||
          areIncluded(
            filter.btcNetwork,
            offer.offerInfo.publicPart.btcNetwork
          )) &&
        (!filter.friendLevel ||
          (filter.friendLevel.includes('FIRST_DEGREE') &&
          !filter.friendLevel.includes('SECOND_DEGREE')
            ? areIncluded(
                filter.friendLevel,
                offer.offerInfo.privatePart.friendLevel
              )
            : true)) &&
        (!filter.offerType ||
          offer.offerInfo.publicPart.offerType === filter.offerType) &&
        (!filter.amountBottomLimit ||
          offer.offerInfo.publicPart.amountBottomLimit >=
            filter.amountBottomLimit) &&
        (!filter.amountTopLimit ||
          offer.offerInfo.publicPart.amountTopLimit <= filter.amountTopLimit)
    )

    return sortOffers(filtered, filter.sort ?? 'NEWEST_OFFER')
  })
}

export function singleOfferAtom(
  offerId: OfferId | undefined
): FocusAtomType<OneOfferInState | undefined> {
  return focusAtom(offersAtom, (optic) =>
    optic.find((offer) => offer.offerInfo.offerId === offerId)
  )
}

export function createSingleOfferReportedFlagAtom(
  offerId: OfferId | undefined
): WritableAtom<boolean | undefined, [SetStateAction<boolean>], void> {
  return createSingleOfferReportedFlagFromAtomAtom(singleOfferAtom(offerId))
}

export function createSingleOfferReportedFlagFromAtomAtom(
  offerAtom: FocusAtomType<OneOfferInState | undefined>
): WritableAtom<boolean | undefined, [SetStateAction<boolean>], void> {
  return focusAtom(offerAtom, (optic) =>
    optic.optional().prop('flags').prop('reported')
  )
}

export function focusOfferByPublicKeyAtom(
  publicKey: PublicKeyPemBase64
): FocusAtomType<OneOfferInState | undefined> {
  return focusAtom(offersAtom, (optic) =>
    optic.find((one) => one.offerInfo.publicPart.offerPublicKey === publicKey)
  )
}

export function singleOfferByAdminIdAtom(
  adminId: OfferAdminId | undefined
): FocusAtomType<OneOfferInState | undefined> {
  return focusAtom(offersAtom, (optic) =>
    optic.find((offer) => offer.ownershipInfo?.adminId === adminId)
  )
}

export function offerFlagsAtom(
  offerId: OfferId
): FocusAtomType<OfferFlags | undefined> {
  return focusAtom(offersAtom, (optic) =>
    optic.find((offer) => offer.offerInfo.offerId === offerId).prop('flags')
  )
}

export const loadingStateAtom = atom<LoadingState>({state: 'initial'})

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function offerForChatOriginAtom(chatOrigin: ChatOrigin) {
  return atom((get) => {
    if (chatOrigin.type === 'unknown') return undefined
    return get(singleOfferAtom(chatOrigin.offerId))
  })
}
