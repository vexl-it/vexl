import {atom} from 'jotai'
import {btcPriceDataAtom} from '../../../state/currentBtcPriceAtoms'
import {originOfferCurrencyAtom} from './fromChatAtoms'
import {type BtcPriceDataWithState} from '@vexl-next/domain/src/general/btcPrice'

export const btcPriceForOfferWithStateAtom = atom((get) => {
  const originOfferCurrency = get(originOfferCurrencyAtom)
  const btcPriceData = get(btcPriceDataAtom)

  return originOfferCurrency
    ? btcPriceData[originOfferCurrency]
    : ({btcPrice: 0, state: 'error'} satisfies BtcPriceDataWithState)
})
