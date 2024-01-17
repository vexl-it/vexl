import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {type MoleculeOrInterface, createScope, molecule} from 'bunshi'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {randomUUID} from 'node:crypto'
import {z} from 'zod'
import {privateApiAtom} from '../../api'
import {loadableEither} from '../../utils/atomUtils/loadableEither'
import {getCurrentLocale} from '../../utils/localization/I18nProvider'
import {useMolecule} from 'bunshi/dist/react'
import {splitAtom} from 'jotai/utils'

export const LocationSessionId = z.string().uuid().brand<'LocationSessionId'>()
export type LocationSessionId = z.TypeOf<typeof LocationSessionId>
export function newLocationSessionId(): LocationSessionId {
  return LocationSessionId.parse(randomUUID())
}

export interface LocationSugegstionState {
  loading: boolean
  error?: string
  data: LocationSuggestion[]
}

export const LocationSearchScope = createScope<{sessionId: LocationSessionId}>({
  sessionId: newLocationSessionId(),
})

export const LocationSearchMolecule = molecule((_, getScope) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sessionId = getScope(LocationSearchScope).sessionId // We need to use this to make sure the scope is used

  const searchQueryAtom = atom('')

  const searchResultsAtom = loadableEither(
    atom(async (get, {signal}) => {
      const query = get(searchQueryAtom)
      if (query.trim() === '') return await TE.right([])()

      return await pipe(
        get(privateApiAtom).location.getLocationSuggestions(
          {
            count: 10,
            phrase: query,
            lang: getCurrentLocale(),
          },
          signal
        ),
        TE.map((one) => one.result)
      )()
    })
  )

  const searchResultsOrEmptyArrayAtom = atom((get): LocationSuggestion[] => {
    const searchResults = get(searchResultsAtom)
    if (searchResults.state === 'loading') return []
    return pipe(
      searchResults.either,
      E.getOrElseW(() => [])
    )
  })
  const searchResultsAtomsAtom = splitAtom(searchResultsOrEmptyArrayAtom)
  const isLoadingAtom = atom(
    (get) => get(searchResultsAtom).state === 'loading'
  )
  const errorAtom = atom((get) => {
    const result = get(searchResultsAtom)

    if (result.state === 'done' && E.isLeft(result.either)) {
      return result.either.left
    }
    return null
  })

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
