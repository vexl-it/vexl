import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import reportError from '../../../utils/reportError'
import {useOnFocusAndAppState} from '../../../utils/useFocusAndAppState'
import {type ContactInfo, type StoredContact} from '../domain'
import getContactsAndTryToResolveThePermissionsAlongTheWay from '../utils'
import {storedContactsAtom} from './contactsStore'

function filterNotStoredContacts(storedContacts: StoredContact[]) {
  return (contactsFromDevice: ContactInfo[]) => {
    return contactsFromDevice.filter(
      (contactFromDevice) =>
        !storedContacts.some(
          (storedContact) =>
            storedContact.info.rawNumber === contactFromDevice.rawNumber
        )
    )
  }
}

const loadContactsFromDeviceActionAtom = atom(null, (get, set) =>
  pipe(
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
      () => true
    )
  )
)

export default loadContactsFromDeviceActionAtom

export function useRefreshContactsFromDeviceOnResume(): void {
  const loadContactsFromDevice = useSetAtom(loadContactsFromDeviceActionAtom)
  useOnFocusAndAppState(
    useCallback(() => {
      void loadContactsFromDevice()()
    }, [loadContactsFromDevice])
  )
}
