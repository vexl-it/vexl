import {molecule} from 'bunshi/dist/react'
import {atom} from 'jotai'
import {type MapValue} from '../Map/brands'

export const LocationPickerMolecule = molecule(() => {
  const selectedMapValueAtom = atom<MapValue | null>(null)
  const isLocationServiceDownAtom = atom(false)

  const resetLocationPickerActionAtom = atom(null, (_get, set) => {
    set(selectedMapValueAtom, null)
    set(isLocationServiceDownAtom, false)
  })

  return {
    selectedMapValueAtom,
    isLocationServiceDownAtom,
    resetLocationPickerActionAtom,
  }
})
