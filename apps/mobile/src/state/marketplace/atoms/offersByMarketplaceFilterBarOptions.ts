import {atom} from 'jotai'
import {selectOffersByMarketplaceFilterBarOptions} from '../utils/filterMarketplaceOffers'
import {filterBarOptionsAtom} from './filterAtoms'
import {offersToSeeInMarketplaceAtom} from './offersToSeeInMarketplace'

export const offersSelectedByMarketplaceFilterBarOptionsAtom = atom((get) => {
  return selectOffersByMarketplaceFilterBarOptions({
    offers: get(offersToSeeInMarketplaceAtom),
    selectedOptions: get(filterBarOptionsAtom),
  })
})

export const offersToSeeInMarketplaceCountAtom = atom((get) => {
  return get(offersSelectedByMarketplaceFilterBarOptionsAtom).length
})
