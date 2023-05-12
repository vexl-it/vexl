import {type Atom, atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {focusAtom} from 'jotai-optics'
import {
  type LoadingState,
  type OffersFilter,
  OffersState,
  type OneOfferInState,
} from './domain'
import {
  type OfferFlags,
  type OfferId,
} from '@vexl-next/domain/dist/general/offers'
import {MINIMAL_DATE} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {areIncluded} from './utils'
import {type ChatOrigin} from '@vexl-next/domain/dist/general/messaging'
import {type FocusAtomType} from '../../utils/atomUtils/FocusAtomType'

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

export const offersToSee = focusAtom(offersAtom, (optic) =>
  optic.filter((o) => !o.ownershipInfo && !o.flags.reported)
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

export const myActiveOffersAtom = focusAtom(myOffersAtom, (optic) =>
  optic.filter((myOffer) => myOffer.offerInfo.publicPart.active)
)

export function offersAtomWithFilter(
  filter: OffersFilter
): Atom<OneOfferInState[]> {
  return focusAtom(offersToSee, (optic) =>
    optic.filter(
      (offer) =>
        (!filter.currency ||
          filter.currency.includes(offer.offerInfo.publicPart.currency)) &&
        (!filter.location ||
          areIncluded(filter.location, offer.offerInfo.publicPart.location)) &&
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
          areIncluded(
            filter.friendLevel,
            offer.offerInfo.privatePart.friendLevel
          )) &&
        (!filter.offerType ||
          offer.offerInfo.publicPart.offerType === filter.offerType)
    )
  )
}

export function singleOfferAtom(
  offerId: OfferId | undefined
): FocusAtomType<OneOfferInState | undefined> {
  return focusAtom(offersAtom, (optic) =>
    optic.find((offer) => offer.offerInfo.offerId === offerId)
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
