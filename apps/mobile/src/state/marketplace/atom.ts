import {type Atom, atom} from 'jotai'
import {atomWithParsedMmkvStorage} from '../../utils/atomWithParsedMmkvStorage'
import {focusAtom} from 'jotai-optics'
import {
  type LoadingState,
  type OffersFilter,
  OffersState,
  type OneOfferInState,
} from './domain'
import {type OfferId} from '@vexl-next/domain/dist/general/offers'
import {MINIMAL_DATE} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {areIncluded} from './utils'

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
  optic.filter((o) => !o.flags.isMine && !o.flags.reported)
)

export const offersIdsAtom = focusAtom(offersAtom, (optic) =>
  optic.elems().prop('offerInfo').prop('offerId')
)

export const lastUpdatedAtAtom = focusAtom(offersStateAtom, (optic) =>
  optic.prop('lastUpdatedAt')
)

export const myOffersAtom = focusAtom(offersAtom, (optic) =>
  optic.filter((offer) => offer.flags.isMine)
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function singleOfferAtom(offerId: OfferId) {
  return focusAtom(offersAtom, (optic) =>
    optic.find((offer) => offer.offerInfo.offerId === offerId)
  )
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function offerFlagsAtom(offerId: OfferId) {
  return focusAtom(offersAtom, (optic) =>
    optic.find((offer) => offer.offerInfo.offerId === offerId).prop('flags')
  )
}

export const loadingStateAtom = atom<LoadingState>({state: 'initial'})
