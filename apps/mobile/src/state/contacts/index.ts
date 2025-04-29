import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
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
            TE.Do,
            TE.map(() => {
              store.set(loadingContactsFromDeviceAtom, true)
            }),
            TE.chainW(() => store.set(loadContactsFromDeviceActionAtom)),
            TE.match(
              (e) => {
                if (
                  e._tag === 'PermissionsNotGranted' &&
                  store.get(lastImportOfContactsAtom) !== undefined
                ) {
                  store.set(eraseImportedContacts)
                  return store.set(submitContactsActionAtom, {
                    normalizeAndImportAll: false,
                    numbersToImport: [],
                    showOfferReencryptionDialog: true,
                  })
                }

                return T.of('success' as const)
              },
              () => {
                return T.of('success' as const)
              }
            ),
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
