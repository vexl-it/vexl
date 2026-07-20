import {Effect, Exit} from 'effect'
import {atom} from 'jotai'
import type {
  ContactsPermissionsNotGrantedError,
  UnknownContactsError,
} from '../utils'
import loadContactsFromDeviceActionAtom, {
  loadingContactsFromDeviceAtom,
} from './loadContactsFromDeviceActionAtom'
import normalizeStoredContactsActionAtom, {
  type NormalizationProgressListener,
} from './normalizeStoredContactsActionAtom'

type LoadContactsFromDeviceError =
  | ContactsPermissionsNotGrantedError
  | UnknownContactsError

interface LoadAndNormalizeContactsFromDeviceOptions {
  readonly onContactsLoaded?: () => void
  readonly onNormalizationProgress?: NormalizationProgressListener
}

function effectFromExit<A, E>(exit: Exit.Exit<A, E>): Effect.Effect<A, E> {
  return Exit.matchEffect(exit, {
    onFailure: Effect.failCause,
    onSuccess: Effect.succeed,
  })
}

const loadAndNormalizeContactsFromDeviceInFlightAtom = atom<
  Promise<Exit.Exit<boolean, LoadContactsFromDeviceError>> | undefined
>(undefined)

const loadAndNormalizeContactsFromDeviceActionAtom = atom(
  null,
  (
    get,
    set,
    options: LoadAndNormalizeContactsFromDeviceOptions = {}
  ): Effect.Effect<boolean, LoadContactsFromDeviceError> =>
    Effect.suspend(() => {
      const inFlight = get(loadAndNormalizeContactsFromDeviceInFlightAtom)
      if (inFlight !== undefined) {
        return Effect.promise(() => inFlight).pipe(
          Effect.flatMap(effectFromExit)
        )
      }

      const effect = Effect.gen(function* (_) {
        set(loadingContactsFromDeviceAtom, true)

        yield* _(set(loadContactsFromDeviceActionAtom))
        options.onContactsLoaded?.()

        yield* _(
          set(normalizeStoredContactsActionAtom, {
            onProgress: options.onNormalizationProgress ?? (() => {}),
          })
        )

        return true
      }).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            set(loadingContactsFromDeviceAtom, false)
          })
        )
      )

      const runPromise = Effect.runPromiseExit(effect).finally(() => {
        if (
          get(loadAndNormalizeContactsFromDeviceInFlightAtom) === runPromise
        ) {
          set(loadAndNormalizeContactsFromDeviceInFlightAtom, undefined)
        }
      })
      set(loadAndNormalizeContactsFromDeviceInFlightAtom, runPromise)

      return Effect.promise(() => runPromise).pipe(
        Effect.flatMap(effectFromExit)
      )
    })
)

export default loadAndNormalizeContactsFromDeviceActionAtom
