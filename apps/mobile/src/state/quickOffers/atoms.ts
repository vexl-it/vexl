import {
  type OfferType,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {isQuickOffer} from '@vexl-next/domain/src/general/quickOffers'
import {Array, Effect, pipe} from 'effect'
import {atom, type SetStateAction} from 'jotai'
import getValueFromSetStateActionOfAtom from '../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {isOfferExpired} from '../../utils/isOfferExpired'
import {offersAtom} from '../marketplace/atoms/offersState'
import {sessionDataOrDummyAtom} from '../session'
import {reconcileQuickOffersActionAtom} from './reconcileQuickOffersActionAtom'

export const quickOffersEnabledAtom = atom(
  (get) => get(sessionDataOrDummyAtom).quickOffersEnabled,
  (get, set, next: SetStateAction<boolean>) => {
    const quickOffersEnabled = getValueFromSetStateActionOfAtom(next)(
      () => get(sessionDataOrDummyAtom).quickOffersEnabled
    )
    set(sessionDataOrDummyAtom, (session) => ({
      ...session,
      quickOffersEnabled,
    }))
    Effect.runFork(set(reconcileQuickOffersActionAtom))
  }
)

// Other people's active quick offers. Reported offers and offers I already
// have a chat for are left for the caller to decide.
export const othersQuickOffersByTypeAtom = atom(
  (get): Record<OfferType, readonly OneOfferInState[]> => {
    const othersQuickOffers = pipe(
      get(offersAtom),
      Array.filter(
        (offer) =>
          isQuickOffer(offer) &&
          !offer.ownershipInfo &&
          offer.offerInfo.publicPart.active &&
          !isOfferExpired(offer.offerInfo.publicPart.expirationDate)
      )
    )
    const ofType = (offerType: OfferType): readonly OneOfferInState[] =>
      Array.filter(
        othersQuickOffers,
        (offer) => offer.offerInfo.publicPart.offerType === offerType
      )

    return {BUY: ofType('BUY'), SELL: ofType('SELL')}
  }
)
