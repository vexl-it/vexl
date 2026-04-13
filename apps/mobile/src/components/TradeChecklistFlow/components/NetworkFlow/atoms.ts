import {type BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {BtcAddress} from '@vexl-next/domain/src/utility/BtcAddress.brand'
import {Option, Schema} from 'effect/index'
import {atom, type SetStateAction} from 'jotai'
import getValueFromSetStateActionOfAtom from '../../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {addNetworkActionAtom} from '../../atoms/updatesToBeSentAtom'

export const btcNetworkAtom = atom<BtcNetwork>('LIGHTING')
export const btcAddressAtom = atom<BtcAddress | undefined>(undefined)
export const btcAddressTempAtom = atom<string>('')
export const displayParsingErrorAtom = atom<boolean>(false)
export const btcAddressInputAtom = atom(
  (get) => get(btcAddressTempAtom),
  (get, set, update: SetStateAction<string>) => {
    const nextValue = getValueFromSetStateActionOfAtom(update)(() =>
      get(btcAddressTempAtom)
    )

    if (!nextValue) {
      set(displayParsingErrorAtom, false)
      set(btcAddressTempAtom, nextValue)
      return
    }

    const parsingResult = Schema.decodeUnknownOption(BtcAddress)(nextValue)

    if (Option.isSome(parsingResult)) {
      set(displayParsingErrorAtom, false)
    } else {
      set(displayParsingErrorAtom, true)
    }

    set(btcAddressTempAtom, nextValue)
  }
)

export const saveBtcAddressActionAtom = atom(
  null,
  (get, set, btcAddress: string) => {
    if (!btcAddress) {
      set(btcAddressAtom, undefined)
      set(displayParsingErrorAtom, false)
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
    const btcAddress =
      btcNetwork === 'ON_CHAIN' ? get(btcAddressAtom) : undefined

    set(addNetworkActionAtom, {btcNetwork, btcAddress})
  }
)
