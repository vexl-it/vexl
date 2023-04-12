import {atom} from 'jotai'
import {type OfferPublicPart} from '@vexl-next/domain/dist/general/offers'
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {focusAtom} from 'jotai-optics'

interface CreateOffer extends Omit<OfferPublicPart, 'offerPublicKey'> {
  connectionLevel: ConnectionLevel
  secondDegreeFriendsCount: number
}

export const createOfferInitialState: CreateOffer = {
  location: [],
  offerDescription: '',
  amountBottomLimit: 0,
  amountTopLimit: 0,
  feeState: 'WITHOUT_FEE',
  feeAmount: 0,
  locationState: 'IN_PERSON',
  paymentMethod: ['CASH'],
  btcNetwork: ['LIGHTING'],
  currency: 'CZK',
  offerType: 'SELL',
  activePriceState: 'NONE',
  activePriceValue: 0,
  activePriceCurrency: 'CZK',
  active: true,
  groupUuids: [],
  connectionLevel: 'FIRST',
  secondDegreeFriendsCount: 0,
}

export const createOfferStateAtom = atom<CreateOffer>(createOfferInitialState)

export const currencyAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('currency')
)

export const amountBottomLimitAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('amountBottomLimit')
)

export const amountTopLimitAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('amountTopLimit')
)

export const offerTypeAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('offerType')
)

export const feeAmountAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('feeAmount')
)

export const feeStateAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('feeState')
)

export const connectionLevelAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('connectionLevel')
)

export const secondDegreeFriendsCountAtom = focusAtom(
  createOfferStateAtom,
  (optic) => optic.prop('secondDegreeFriendsCount')
)

export const locationStateAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('locationState')
)

export const locationAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('location')
)

export const btcNetworkAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('btcNetwork')
)

export const paymentMethodAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('paymentMethod')
)

export const offerDescriptionAtom = focusAtom(createOfferStateAtom, (optic) =>
  optic.prop('offerDescription')
)
