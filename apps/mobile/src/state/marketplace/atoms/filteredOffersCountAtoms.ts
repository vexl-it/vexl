import {atom} from 'jotai'
import {offersSelectedByMarketplaceFilterBarOptionsAtom} from './offersByMarketplaceFilterBarOptions'

export const offersToSeeInMarketplaceCountAtom = atom((get) => {
  return get(offersSelectedByMarketplaceFilterBarOptionsAtom).length
})
