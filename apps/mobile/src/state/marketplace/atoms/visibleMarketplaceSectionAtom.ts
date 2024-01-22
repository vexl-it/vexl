import {atom} from 'jotai'

const visibleMarketplaceSectionAtom = atom<'BUY' | 'SELL'>('BUY')
export default visibleMarketplaceSectionAtom
