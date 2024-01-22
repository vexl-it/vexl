import {atom} from 'jotai'
import {
  offersFilterInitialState,
  offersFilterTextFromStorageAtom,
} from '../../../state/marketplace/atoms/filterAtoms'
import {safeNavigateBackOutsideReact} from '../../../utils/navigation'
import {addToPreviousSearchesActionAtom} from './previousSearchesAtom'
import {searchTextAtom} from './searchTextAtom'

const submitSearchActionAtom = atom(
  null,
  (get, set, text: string | undefined = undefined) => {
    const filledText = text ?? get(searchTextAtom).trim()

    if (!filledText) {
      set(clearSearchActionAtom)
      return
    }
    set(addToPreviousSearchesActionAtom, filledText)
    set(offersFilterTextFromStorageAtom, filledText)
    safeNavigateBackOutsideReact()
  }
)

export const clearSearchActionAtom = atom(null, (get, set) => {
  set(searchTextAtom, '')
  set(offersFilterTextFromStorageAtom, offersFilterInitialState.text)
  safeNavigateBackOutsideReact()
})

export default submitSearchActionAtom
