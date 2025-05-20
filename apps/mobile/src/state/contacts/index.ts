import {Effect} from 'effect'
import {atom, useStore} from 'jotai'
import {DateTime} from 'luxon'
import {useCallback} from 'react'
import {contactsMigratedAtom} from '../../components/VersionMigrations/atoms'
import {useAppState} from '../../utils/useAppState'
import {postLoginFinishedAtom} from '../postLoginOnboarding'
import {lastImportOfContactsAtom} from './atom/contactsStore'
import loadContactsFromDeviceActionAtom, {
  loadingContactsFromDeviceAtom,
} from './atom/loadContactsFromDeviceActionAtom'

const TIME_SINCE_CONTACTS_IMPORT_THRESHOLD = 60

export const minutesTillOffersDisplayedAtom = atom(
  TIME_SINCE_CONTACTS_IMPORT_THRESHOLD
)

export const initializeMinutesTillOffersDisplayedActionAtom = atom(
  null,
  (get, set) => {
    const lastImportOfContacts = get(lastImportOfContactsAtom)

    const minutesSinceLastImport = Math.abs(
      Math.round(
        DateTime.now().diff(
          DateTime.fromISO(lastImportOfContacts ?? new Date().toISOString()),
          'minutes'
        ).minutes
      )
    )
    const timeLeftTillOffersAreLoaded =
      TIME_SINCE_CONTACTS_IMPORT_THRESHOLD - minutesSinceLastImport

    set(
      minutesTillOffersDisplayedAtom,
      timeLeftTillOffersAreLoaded > 0 && timeLeftTillOffersAreLoaded <= 60
        ? timeLeftTillOffersAreLoaded
        : 0
    )
  }
)

const loadContactsFromDeviceAndSetLoadingStateActionAtom = atom(
  null,
  (get, set) => {
    return Effect.gen(function* (_) {
      set(loadingContactsFromDeviceAtom, true)

      yield* _(set(loadContactsFromDeviceActionAtom)).pipe(
        Effect.catchAll(() => Effect.succeed('success' as const))
      )

      set(loadingContactsFromDeviceAtom, false)
    })
  }
)

export function useRefreshContactsFromDeviceOnResume(): void {
  const store = useStore()

  useAppState(
    useCallback(
      (state) => {
        if (
          store.get(postLoginFinishedAtom) &&
          store.get(contactsMigratedAtom) &&
          state === 'active'
        ) {
          Effect.runFork(
            store.set(loadContactsFromDeviceAndSetLoadingStateActionAtom)
          )
        }
      },
      [store]
    )
  )
}
