import {type BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {BtcAddress} from '@vexl-next/domain/src/utility/BtcAddress.brand'
import {Option, Schema} from 'effect/index'
import {atom} from 'jotai'
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

    const parsingResult = Schema.decodeUnknownOption(BtcAddress)(btcAddress)
    set(displayParsingErrorAtom, Option.isNone(parsingResult))

    if (Option.isSome(parsingResult)) {
      set(btcAddressAtom, parsingResult.value)
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
