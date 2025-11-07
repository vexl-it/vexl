import {Array, Effect, HashMap, Option, pipe} from 'effect'
import {atom} from 'jotai'
import reportError from '../../../utils/reportError'
import {effectWithEnsuredBenchmark} from '../../ActionBenchmarks'
import {type ContactInfo, type StoredContact} from '../domain'
import {getContactsAndTryToResolveThePermissionsAlongTheWay} from '../utils'
import {storedContactsAtom} from './contactsStore'

function filterNotStoredContacts(
  storedContacts: readonly StoredContact[]
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

const loadContactsFromDeviceActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const contactsFromDevice = yield* _(
      getContactsAndTryToResolveThePermissionsAlongTheWay()
    )
    const storedContacts = get(storedContactsAtom)

    const contactsFromDeviceHashMap = HashMap.fromIterable(
      Array.map(contactsFromDevice, (c) => [c.rawNumber, c])
    )

    const updatedStoredContacts = Array.map(
      storedContacts,
      (storedContact) =>
        ({
          ...storedContact,
          info: pipe(
            HashMap.get(
              contactsFromDeviceHashMap,
              storedContact.info.rawNumber
            ),
            Option.getOrElse(() => storedContact.info)
          ),
        }) satisfies StoredContact
    )

    const newContactsToStore = pipe(
      contactsFromDevice,
      filterNotStoredContacts(get(storedContactsAtom)),
      Array.map(
        (newContact) =>
          ({
            info: newContact,
            flags: {
              seen: false,
              imported: false,
              importedManually: false,
              invalidNumber: 'notTriedYet',
            },
            serverHashToClient: Option.none(),
            computedValues: Option.none(),
          }) satisfies StoredContact
      )
    )

    set(storedContactsAtom, [...updatedStoredContacts, ...newContactsToStore])
    return 'success' as const
  }).pipe(
    Effect.catchAll((e) => {
      if (e._tag === 'UnknownContactsError') {
        reportError(
          'error',
          new Error('Error while loading contacts from device'),
          {e}
        )
      }

      return Effect.fail(e)
    }),
    effectWithEnsuredBenchmark('Load contacts from device')
  )
})

export default loadContactsFromDeviceActionAtom
