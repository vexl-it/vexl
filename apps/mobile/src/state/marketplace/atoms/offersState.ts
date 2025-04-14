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
import {Array} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {type Atom, atom, type WritableAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {type SetStateAction} from 'react'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {OffersState} from '../domain'
import {offerWithoutSourceOrNone} from '../utils/offerWithoutSourceOrNone'

export const offersStateAtom = atomWithParsedMmkvStorage(
  'offers',
  {
    lastUpdatedAt1: MINIMAL_DATE,
    offers: [],
  },
  OffersState
)
export const offersAtom = focusAtom(offersStateAtom, (optic) =>
  optic.prop('offers')
)

export const offersIdsAtom = focusAtom(offersAtom, (optic) =>
  optic.elems().prop('offerInfo').prop('offerId')
)

export const lastUpdatedAtAtom = focusAtom(offersStateAtom, (optic) =>
  optic.prop('lastUpdatedAt1')
)

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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function offerForChatOriginAtom(chatOrigin: ChatOrigin) {
  const singleOfferAtomOrNull =
    chatOrigin.type !== 'unknown' ? singleOfferAtom(chatOrigin.offerId) : null
  return atom((get) => {
    if (chatOrigin.type === 'unknown') return undefined

    if (chatOrigin.offer) return chatOrigin.offer
    return singleOfferAtomOrNull ? get(singleOfferAtomOrNull) : undefined
  })
}

export const updateOrFilterOffersFromDeletedClubsActionAtom = atom(
  null,
  (get, set, ...deletedClubs: Array.NonEmptyArray<ClubUuid>) => {
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
