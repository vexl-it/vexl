import {atom} from 'jotai'
import {type BtcNetwork} from '@vexl-next/domain/dist/general/offers'
import {BtcAddress} from '@vexl-next/domain/dist/utility/BtcAddress.brand'
import {addNetworkActionAtom} from '../../atoms/updatesToBeSentAtom'

export const btcNetworkAtom = atom<BtcNetwork>('LIGHTING')
export const btcAddressAtom = atom<BtcAddress | undefined>(undefined)
export const displayParsingErrorAtom = atom<boolean>(false)

export const saveBtcAddressActionAtom = atom(
  null,
  (get, set, btcAddress: string) => {
    if (!btcAddress) {
      set(btcAddressAtom, undefined)
      return true
    }

    const parsingResult = BtcAddress.safeParse(btcAddress)
    set(displayParsingErrorAtom, !parsingResult.success)

    if (parsingResult.success) {
      set(btcAddressAtom, parsingResult.data)
      return true
    }

    return false
  }
)

export const saveLocalNetworkStateToMainStateActionAtom = atom(
  null,
  (get, set) => {
    const btcNetwork = get(btcNetworkAtom)
    const btcAddress = get(btcAddressAtom)

    set(addNetworkActionAtom, {btcNetwork, btcAddress})
  }
)
