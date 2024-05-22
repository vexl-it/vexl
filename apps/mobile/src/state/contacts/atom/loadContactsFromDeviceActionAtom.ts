import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import reportError from '../../../utils/reportError'
import {type ContactInfo, type StoredContact} from '../domain'
import {getContactsAndTryToResolveThePermissionsAlongTheWay} from '../utils'
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

export const loadingContactsFromDeviceAtom = atom<boolean>(false)

const loadContactsFromDeviceActionAtom = atom(
  null,
  (get, set): T.Task<'success' | 'missingPermissions' | 'otherError'> => {
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
      TE.matchE(
        (e) => {
          if (e._tag === 'PermissionsNotGranted') {
            return T.of('missingPermissions' as const)
          }
          reportError(
            'error',
            new Error('Error while loading contacts from device'),
            {e}
          )

          return T.of('otherError')
        },
        () => {
          return T.of('success')
        }
      )
    )
  }
)

export default loadContactsFromDeviceActionAtom
