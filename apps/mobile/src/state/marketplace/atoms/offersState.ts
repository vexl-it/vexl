import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type ChatOrigin} from '@vexl-next/domain/src/general/messaging'
import {
  type OfferAdminId,
  type OfferFlags,
  type OfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {MINIMAL_DATE} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {Array, Record} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom, type Atom, type WritableAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {type SetStateAction} from 'react'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {OffersState} from '../domain'
import {isProductOfferMissingCategory} from '../utils/isProductOfferMissingCategory'
import {offerWithoutSourceOrNone} from '../utils/offerWithoutSourceOrNone'

export const OFFERS_STORAGE_KEY = 'offers'

export const offersStateAtom = atomWithParsedMmkvStorage(
  OFFERS_STORAGE_KEY,
  {
    contactOffersNextPageParam: undefined,
    clubOffersNextPageParam: {},
    offers: [],
    lastUpdatedAt2: MINIMAL_DATE,
  },
  OffersState
)
export const offersAtom = focusAtom(offersStateAtom, (optic) =>
  optic.prop('offers')
)

export const areThereAnyStoredOffersAtom = atom((get) =>
  Array.isNonEmptyReadonlyArray(get(offersAtom))
)

export const offersIdsAtom = focusAtom(offersAtom, (optic) =>
  optic.elems().prop('offerInfo').prop('offerId')
)

export const contactOffersNextPageParamAtom = focusAtom(
  offersStateAtom,
  (optic) => optic.prop('contactOffersNextPageParam')
)

export const clubOffersNextPageParamAtom = focusAtom(offersStateAtom, (optic) =>
  optic.prop('clubOffersNextPageParam')
)

export function singleOfferAtom(
  offerId: OfferId | undefined
): FocusAtomType<OneOfferInState | undefined> {
  return focusAtom(offersAtom, (optic) =>
    optic.find((offer) => offer.offerInfo.offerId === offerId)
  )
}

export function isOfferMissingProductCategoryAtom(
  offerId: OfferId | undefined
): Atom<boolean> {
  const offerAtom = singleOfferAtom(offerId)

  return atom((get) => {
    const offer = get(offerAtom)
    return offer ? isProductOfferMissingCategory(offer) : false
  })
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

export function offerForChatOriginAtom(
  chatOrigin: ChatOrigin
): Atom<OneOfferInState | undefined> {
  const isOfferOrigin =
    chatOrigin.type === 'myOffer' || chatOrigin.type === 'theirOffer'
  const singleOfferAtomOrNull = isOfferOrigin
    ? singleOfferAtom(chatOrigin.offerId)
    : null
  return atom((get) => {
    if (chatOrigin.type !== 'myOffer' && chatOrigin.type !== 'theirOffer')
      return undefined

    if (chatOrigin.offer) return chatOrigin.offer
    return singleOfferAtomOrNull ? get(singleOfferAtomOrNull) : undefined
  })
}

export const updateOrFilterOffersFromDeletedClubsActionAtom = atom(
  null,
  (get, set, deletedClubs: Array.NonEmptyArray<ClubUuid>) => {
    set(
      offersAtom,
      Array.filterMap((offer) =>
        offerWithoutSourceOrNone(offer, deletedClubs, false)
      )
    )
  }
)

export function createOfferCountForClub(clubUuid: ClubUuid): Atom<number> {
  return atom((get) => {
    return pipe(
      get(offersAtom),
      Array.filter((one) =>
        Array.contains(one.offerInfo.privatePart.clubIds, clubUuid)
      ),
      Array.length
    )
  })
}

export const removeClubOffersNextPageParamFromStateActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    set(clubOffersNextPageParamAtom, Record.remove(clubUuid))
  }
)
