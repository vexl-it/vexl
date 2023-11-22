import {MINIMAL_DATE} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {
  type OfferFlags,
  type OfferAdminId,
  type OfferId,
  type OneOfferInState,
} from '@vexl-next/domain/dist/general/offers'
import {OffersState} from '../domain'
import {focusAtom} from 'jotai-optics'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {atom, type WritableAtom} from 'jotai'
import {type SetStateAction} from 'react'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ChatOrigin} from '@vexl-next/domain/dist/general/messaging'

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

export const offersIdsAtom = focusAtom(offersAtom, (optic) =>
  optic.elems().prop('offerInfo').prop('offerId')
)

export const lastUpdatedAtAtom = focusAtom(offersStateAtom, (optic) =>
  optic.prop('lastUpdatedAt')
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
  return atom((get) => {
    if (chatOrigin.type === 'unknown') return undefined

    if (chatOrigin.offer) return chatOrigin.offer
    return get(singleOfferAtom(chatOrigin.offerId))
  })
}
