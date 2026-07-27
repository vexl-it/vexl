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

interface LoadAndNormalizeContactsFromDeviceInFlightRun {
  promise: Promise<Exit.Exit<boolean, LoadContactsFromDeviceError>>
  readonly listeners: Set<LoadAndNormalizeContactsFromDeviceOptions>
  contactsLoaded: boolean
}

function effectFromExit<A, E>(exit: Exit.Exit<A, E>): Effect.Effect<A, E> {
  return Exit.matchEffect(exit, {
    onFailure: Effect.failCause,
    onSuccess: Effect.succeed,
  })
}

function safelyNotify(callback: () => void): void {
  try {
    callback()
  } catch (e) {
    console.warn(
      'Error in loadAndNormalizeContactsFromDevice listener callback',
      e
    )
  }
}

const loadAndNormalizeContactsFromDeviceInFlightAtom = atom<
  LoadAndNormalizeContactsFromDeviceInFlightRun | undefined
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
        inFlight.listeners.add(options)
        if (inFlight.contactsLoaded && options.onContactsLoaded) {
          safelyNotify(options.onContactsLoaded)
        }
        return Effect.promise(async () => await inFlight.promise).pipe(
          Effect.flatMap(effectFromExit)
        )
      }

      const run: LoadAndNormalizeContactsFromDeviceInFlightRun = {
        // Placeholder, replaced with the real promise below before the run
        // is published to the in-flight atom.
        promise: new Promise(() => {}),
        listeners: new Set([options]),
        contactsLoaded: false,
      }

      const effect = Effect.gen(function* (_) {
        set(loadingContactsFromDeviceAtom, true)

        yield* _(set(loadContactsFromDeviceActionAtom))
        run.contactsLoaded = true
        for (const listener of run.listeners) {
          if (listener.onContactsLoaded) safelyNotify(listener.onContactsLoaded)
        }

        yield* _(
          set(normalizeStoredContactsActionAtom, {
            onProgress: (progress) => {
              for (const listener of run.listeners) {
                if (listener.onNormalizationProgress) {
                  const {onNormalizationProgress} = listener
                  safelyNotify(() => {
                    onNormalizationProgress(progress)
                  })
                }
              }
            },
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

      run.promise = Effect.runPromiseExit(effect).finally(() => {
        if (get(loadAndNormalizeContactsFromDeviceInFlightAtom) === run) {
          set(loadAndNormalizeContactsFromDeviceInFlightAtom, undefined)
        }
      })
      set(loadAndNormalizeContactsFromDeviceInFlightAtom, run)

      return Effect.promise(async () => await run.promise).pipe(
        Effect.flatMap(effectFromExit)
      )
    })
)

export default loadAndNormalizeContactsFromDeviceActionAtom
