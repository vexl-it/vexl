import {atom} from 'jotai'
import {DateTime} from 'luxon'
import {lastImportOfContactsAtom} from './atom/contactsStore'

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
