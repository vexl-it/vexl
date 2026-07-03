import {type BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {atom} from 'jotai'
import {addNetworkActionAtom} from '../../atoms/updatesToBeSentAtom'

export const btcNetworkAtom = atom<BtcNetwork>('LIGHTING')

export const saveLocalNetworkStateToMainStateActionAtom = atom(
  null,
  (get, set) => {
    const btcNetwork = get(btcNetworkAtom)

    set(addNetworkActionAtom, {btcNetwork})
  }
)
