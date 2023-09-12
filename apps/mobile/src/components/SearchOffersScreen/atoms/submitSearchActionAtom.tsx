import {atom} from 'jotai'
import {searchTextAtom} from './searchTextAtom'
import {addToPreviousSearchesActionAtom} from './previousSearchesAtom'
import {safeNavigateBackOutsideReact} from '../../../utils/navigation'
import {focusTextFilterAtom} from '../../FilterOffersScreen/atom'

const submitSearchActionAtom = atom(
  null,
  (get, set, text: string | undefined = undefined) => {
    const filledText = text ?? get(searchTextAtom).trim()

    if (!filledText) {
      set(clearSearchActionAtom)
      return
    }
    set(addToPreviousSearchesActionAtom, filledText)
    set(focusTextFilterAtom, filledText)
    safeNavigateBackOutsideReact()
  }
)

export const clearSearchActionAtom = atom(null, (get, set) => {
  set(searchTextAtom, '')
  set(focusTextFilterAtom, undefined)
  safeNavigateBackOutsideReact()
})

export default submitSearchActionAtom
