import {atom} from 'jotai'
import {type MainTradeCheckListState} from '../domain'

/**
 * @deprecated use fromChatAtoms
 */
export const mainTradeCheckListStateAtom = atom<MainTradeCheckListState>({
  'DATE_AND_TIME': {
    status: 'initial',
    data: [],
  },
  'MEETING_LOCATION': {
    status: 'initial',
  },
  'CALCULATE_AMOUNT': {
    status: 'initial',
    btcOrSat: 'BTC',
    tradePriceType: 'live',
    btcPrice: 0,
    btcAmount: 0,
    fiatAmount: 0,
    feeAmount: 0,
  },
  'SET_NETWORK': {
    status: 'initial',
    btcNetwork: 'LIGHTING',
  },
  'REVEAL_IDENTITY': {
    status: 'initial',
  },
  'REVEAL_PHONE_NUMBER': {
    status: 'initial',
  },
})
