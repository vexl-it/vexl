import {
  GetLocationSuggestionsResponse,
  type LocationSuggestion,
} from '@vexl-next/rest-api/src/services/location/contracts'
import {createScope, molecule, use} from 'bunshi/dist/react'
import {randomUUID} from 'crypto'
import {Effect, Schema} from 'effect/index'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../api'
import {createEffectAtomWithProgress} from '../../utils/atomUtils/createEffectAtomWithProgress'
import {appLanguageAtom} from '../../utils/preferences'
import {transientRequestRetryPolicy} from '../../utils/transientRequestRetryPolicy'

export const LocationSessionId = Schema.UUID.pipe(
  Schema.brand('LocationSessionId')
)
export type LocationSessionId = typeof LocationSessionId.Type
export function newLocationSessionId(): LocationSessionId {
  return Schema.decodeSync(LocationSessionId)(randomUUID())
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
      query.trim() === ''
        ? Effect.succeed(new GetLocationSuggestionsResponse({result: []}))
        : get(apiAtom)
            .location.getLocationSuggestions({
              phrase: query,
              lang: get(appLanguageAtom),
            })
            .pipe(Effect.retry(transientRequestRetryPolicy)),
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
