import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/lib/function'
import {atom, useStore} from 'jotai'
import {DateTime} from 'luxon'
import {useCallback} from 'react'
import {contactsMigratedAtom} from '../../components/VersionMigrations/atoms'
import {useAppState} from '../../utils/useAppState'
import {postLoginFinishedAtom} from '../postLoginOnboarding'
import {
  eraseImportedContacts,
  lastImportOfContactsAtom,
} from './atom/contactsStore'
import loadContactsFromDeviceActionAtom, {
  loadingContactsFromDeviceAtom,
} from './atom/loadContactsFromDeviceActionAtom'
import {submitContactsActionAtom} from './atom/submitContactsActionAtom'

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
          void pipe(
            T.Do,
            T.map(() => {
              store.set(loadingContactsFromDeviceAtom, true)
            }),
            T.chain(() => store.set(loadContactsFromDeviceActionAtom)),
            T.chain((result) => {
              if (
                result === 'missingPermissions' &&
                // Not needed when user did not imported contacts yet - there is nothing to erase
                store.get(lastImportOfContactsAtom) !== undefined
              ) {
                store.set(eraseImportedContacts)
                return store.set(submitContactsActionAtom, {
                  normalizeAndImportAll: false,
                })
              }
              return T.Do
            }),
            T.map(() => {
              store.set(loadingContactsFromDeviceAtom, false)
            })
          )()
        }
      },
      [store]
    )
  )
}
