import {atom} from 'jotai'

// TODO mmkv atom?
const marketplaceLayoutModeAtom = atom<'list' | 'map'>('list')
export const toggleMarketplaceLayoutModeActionAtom = atom(
  (get) => get(marketplaceLayoutModeAtom),
  (get, set) => {
    set(marketplaceLayoutModeAtom, (old) => (old === 'list' ? 'map' : 'list'))
  }
)

export default marketplaceLayoutModeAtom
