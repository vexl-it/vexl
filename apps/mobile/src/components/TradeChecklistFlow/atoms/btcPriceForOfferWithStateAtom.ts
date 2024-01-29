import {createBtcPriceForCurrencyAtom} from '../../../state/currentBtcPriceAtoms'
import {originOfferCurrencyAtom} from '../../../state/tradeChecklist/atoms/fromChatAtoms'

export const btcPriceForOfferWithStateAtom = createBtcPriceForCurrencyAtom(
  originOfferCurrencyAtom
)
