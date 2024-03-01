import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom, useSetAtom, useStore} from 'jotai'
import {useCallback} from 'react'
import {contactsMigratedAtom} from '../../../components/VersionMigrations/atoms'
import reportError from '../../../utils/reportError'
import {useAppState} from '../../../utils/useAppState'
import {postLoginFinishedAtom} from '../../postLoginOnboarding'
import {type ContactInfo, type StoredContact} from '../domain'
import getContactsAndTryToResolveThePermissionsAlongTheWay from '../utils'
import {storedContactsAtom} from './contactsStore'

function filterNotStoredContacts(
  storedContacts: StoredContact[]
): (contactsFromDevice: ContactInfo[]) => ContactInfo[] {
  const storedContactsRawNumbersSet = new Set(
    storedContacts.map((c) => c.info.rawNumber)
  )

  return (contactsFromDevice: ContactInfo[]) => {
    return contactsFromDevice.filter(
      (contactFromDevice) =>
        !storedContactsRawNumbersSet.has(contactFromDevice.rawNumber)
    )
  }
}

const loadContactsFromDeviceActionAtom = atom(null, (get, set) => {
  return pipe(
    getContactsAndTryToResolveThePermissionsAlongTheWay(),
    TE.map(filterNotStoredContacts(get(storedContactsAtom))),
    TE.map((newContacts) => {
      set(storedContactsAtom, (storedContacts) => [
        ...storedContacts,
        ...newContacts.map((newContact) => {
          return {
            info: newContact,
            flags: {
              seen: false,
              imported: false,
              importedManually: false,
              invalidNumber: 'notTriedYet',
            },
            computedValues: undefined,
          } satisfies StoredContact
        }),
      ])
    }),
    TE.match(
      (e) => {
        reportError(
          'error',
          new Error('Error while loading contacts from device'),
          {e}
        )
        return false
      },
      () => {
        return true
      }
    )
  )
})

export default loadContactsFromDeviceActionAtom

export function useRefreshContactsFromDeviceOnResume(): void {
  const store = useStore()
  const loadContactsFromDevice = useSetAtom(loadContactsFromDeviceActionAtom)

  useAppState(
    useCallback(
      (state) => {
        if (
          store.get(postLoginFinishedAtom) &&
          store.get(contactsMigratedAtom) &&
          state === 'active'
        )
          void loadContactsFromDevice()()
      },
      [loadContactsFromDevice, store]
    )
  )
}
