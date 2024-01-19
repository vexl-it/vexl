import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import deduplicate from '../../../utils/deduplicate'
import {searchTextAtom} from './searchTextAtom'

const PREVIOUS_SEARCHES_MAX_COUNT = 20

const previousSearchesStorageAtom = atomWithParsedMmkvStorage(
  'previousSearches',
  {previousSearches: []},
  z.object({previousSearches: z.array(z.string())})
)

export const previousSearchesAtom = focusAtom(
  previousSearchesStorageAtom,
  (o) => o.prop('previousSearches')
)

export const addToPreviousSearchesActionAtom = atom(
  null,
  (get, set, search: string) => {
    set(previousSearchesAtom, (previousSearches) => {
      return deduplicate(
        [search, ...previousSearches].slice(0, PREVIOUS_SEARCHES_MAX_COUNT)
      )
    })
  }
)

export const previousSearchesToDisplay = atom((get) => {
  const searchText = get(searchTextAtom)
  if (!searchText.trim()) return get(previousSearchesAtom)

  return get(previousSearchesAtom).filter((search) =>
    search.toLowerCase().includes(searchText.toLowerCase())
  )
})

export const previousSearchToDisplayAtomsAtom = splitAtom(
  previousSearchesToDisplay
)
