import {Option} from 'effect/index'
import {atom} from 'jotai'
import {reachNumberAtom} from '../../connections/atom/connectionStateAtom'
import {importedContactsCountAtom} from '../../contacts/atom/contactsStore'
import {notificationsEnabledAtom} from '../../notifications/areNotificationsEnabledAtom'
import {REACH_NUMBER_THRESHOLD} from '../domain'
import {areThereAnyMyOffersAtom} from './myOffers'

export const shouldShowLoadingOffersAtom = atom((get) => {
  const importedContactsCount = get(importedContactsCountAtom)
  const reachNumber = get(reachNumberAtom)
  const areNotificationsEnabled = get(notificationsEnabledAtom)
  const areThereAnyMyOffers = get(areThereAnyMyOffersAtom)

  return (
    importedContactsCount > 0 &&
    reachNumber >= REACH_NUMBER_THRESHOLD &&
    Option.isSome(areNotificationsEnabled) &&
    areNotificationsEnabled.value.notifications &&
    areThereAnyMyOffers
  )
})
