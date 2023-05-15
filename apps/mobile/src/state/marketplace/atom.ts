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
  type Sort,
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

export const myOffersSortingOptionAtom = atom<Sort>('NEWEST_OFFER')

export function sortOffers(
  offersAtom: Atom<OneOfferInState[]>,
  sort: Sort
): Atom<OneOfferInState[]> {
  return atom((get) => {
    const offersFiltered = get(offersAtom)
    if (sort === 'LOWEST_FEE_FIRST')
      return offersFiltered.sort(function (
        a: OneOfferInState,
        b: OneOfferInState
      ) {
        return (
          a.offerInfo.publicPart.feeAmount - b.offerInfo.publicPart.feeAmount
        )
      })
    if (sort === 'HIGHEST_FEE')
      return offersFiltered.sort(function (
        a: OneOfferInState,
        b: OneOfferInState
      ) {
        return (
          b.offerInfo.publicPart.feeAmount - a.offerInfo.publicPart.feeAmount
        )
      })
    if (sort === 'NEWEST_OFFER')
      return offersFiltered.sort(function (
        a: OneOfferInState,
        b: OneOfferInState
      ) {
        return b.offerInfo.id - a.offerInfo.id
      })
    if (sort === 'OLDEST_OFFER')
      return offersFiltered.sort(function (
        a: OneOfferInState,
        b: OneOfferInState
      ) {
        return a.offerInfo.id - b.offerInfo.id
      })
    if (sort === 'LOWEST_AMOUNT')
      return offersFiltered.sort(function (
        a: OneOfferInState,
        b: OneOfferInState
      ) {
        return (
          a.offerInfo.publicPart.amountTopLimit -
          b.offerInfo.publicPart.amountTopLimit
        )
      })
    if (sort === 'HIGHEST_AMOUNT')
      return offersFiltered.sort(function (
        a: OneOfferInState,
        b: OneOfferInState
      ) {
        return (
          b.offerInfo.publicPart.amountTopLimit -
          a.offerInfo.publicPart.amountTopLimit
        )
      })
    return []
  })
}

export function offersAtomWithFilter(
  filter: OffersFilter
): Atom<OneOfferInState[]> {
  const offersFilteredAtom = focusAtom(offersToSee, (optic) =>
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
          offer.offerInfo.publicPart.offerType === filter.offerType) &&
        (!filter.amountBottomLimit ||
          offer.offerInfo.publicPart.amountBottomLimit >=
            filter.amountBottomLimit) &&
        (!filter.amountTopLimit ||
          offer.offerInfo.publicPart.amountTopLimit <= filter.amountTopLimit)
    )
  )
  return sortOffers(offersFilteredAtom, filter.sort ?? 'LOWEST_FEE_FIRST')
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
