import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  createScope,
  molecule,
  type MoleculeOrInterface,
  use,
  useMolecule,
} from 'bunshi/dist/react'
import {randomUUID} from 'crypto'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {z} from 'zod'
import {apiAtom} from '../../api'
import {createEffectAtomWithProgress} from '../../utils/atomUtils/createEffectAtomWithProgress'
import {getCurrentLocale} from '../../utils/localization/I18nProvider'

export const LocationSessionId = z.string().uuid().brand<'LocationSessionId'>()
export type LocationSessionId = z.TypeOf<typeof LocationSessionId>
export function newLocationSessionId(): LocationSessionId {
  return LocationSessionId.parse(randomUUID())
}
export const LocationSearchScope = createScope<LocationSessionId>(
  newLocationSessionId()
)

export const LocationSearchMolecule = molecule(() => {
  use(LocationSearchScope)
  const searchQueryInnerAtom = atom('')

  const {
    resultAtom: searchResultsAtom,
    effectiveInputAtom: searchQueryAtom,
    isLoadingAtom,
    errorAtom,
    successAtom,
  } = createEffectAtomWithProgress({
    inputAtom: searchQueryInnerAtom,
    effectToRun: (query, get) =>
      get(apiAtom).location.getLocationSuggestions({
        phrase: query,
        lang: getCurrentLocale(),
      }),
  })

  const searchResultsOrEmptyArrayAtom = atom(
    // Split atom does not accept readonly -______-
    (get): LocationSuggestion[] => [...(get(successAtom)?.result ?? [])]
  )
  const searchResultsAtomsAtom = splitAtom(searchResultsOrEmptyArrayAtom)

  return {
    searchQueryAtom,
    searchResultsAtom,
    searchResultsAtomsAtom,
    isLoadingAtom,
    errorAtom,
  }
})

type InferMoleculeType<C extends MoleculeOrInterface<any>> =
  C extends MoleculeOrInterface<infer T> ? T : never

export function useLocationSearchMolecule(): InferMoleculeType<
  typeof LocationSearchMolecule
> {
  return useMolecule(LocationSearchMolecule)
}
