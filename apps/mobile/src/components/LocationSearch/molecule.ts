import {type ExtractErrorFromEffect} from '@vexl-next/resources-utils/src/utils/ExtractErrorFromEffect'
import {type LocationSuggestion} from '@vexl-next/rest-api/src/services/location/contracts'
import {createScope, molecule, type MoleculeOrInterface} from 'bunshi'
import {useMolecule} from 'bunshi/dist/react'
import {Effect, Either, Exit, Fiber} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {randomUUID} from 'node:crypto'
import {z} from 'zod'
import {apiAtom} from '../../api'
import {
  loadableEffectEither,
  type UnknownLoadingError,
} from '../../utils/atomUtils/loadableEither'
import {getCurrentLocale} from '../../utils/localization/I18nProvider'

export const LocationSessionId = z.string().uuid().brand<'LocationSessionId'>()
export type LocationSessionId = z.TypeOf<typeof LocationSessionId>
export function newLocationSessionId(): LocationSessionId {
  return LocationSessionId.parse(randomUUID())
}

export const LocationSearchScope = createScope<{sessionId: LocationSessionId}>({
  sessionId: newLocationSessionId(),
})

export const LocationSearchMolecule = molecule((_, getScope) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sessionId = getScope(LocationSearchScope).sessionId // We need to use this to make sure the scope is used

  const searchQueryAtom = atom('')

  const searchResultsAtom = loadableEffectEither(
    atom(
      async (
        get,
        {signal}
      ): Promise<
        Either.Either<
          readonly LocationSuggestion[],
          | ExtractErrorFromEffect<
              ReturnType<typeof api.location.getLocationSuggestions>
            >
          | UnknownLoadingError
        >
      > => {
        const api = get(apiAtom)
        const query = get(searchQueryAtom)
        if (query.trim() === '') return Either.right([])

        const fiber = Effect.runFork(
          api.location
            .getLocationSuggestions({
              query: {
                phrase: query,
                lang: getCurrentLocale(),
              },
            })
            .pipe(
              Effect.map((one) => {
                return one.result
              }),
              Effect.either
            )
        )

        signal.onabort = () => {
          Effect.runFork(Fiber.interruptFork(fiber))
        }

        const exit = await Effect.runPromise(Fiber.await(fiber))

        if (Exit.isSuccess(exit)) {
          return exit.value
        }

        return Either.left({
          _tag: 'UnknownLoadingError',
          error: exit.cause,
        } as UnknownLoadingError)
      }
    )
  )

  const searchResultsOrEmptyArrayAtom = atom((get): LocationSuggestion[] => {
    const searchResults = get(searchResultsAtom)
    if (searchResults.state === 'loading') return []
    return pipe(
      searchResults.either,
      E.getOrElseW(() => []),
      (one) => [...one]
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
