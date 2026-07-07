import {Array, Effect, Option, pipe, Schema} from 'effect'
import {atom} from 'jotai'
import reportError from '../../../utils/reportError'
import {effectWithEnsuredBenchmark} from '../../ActionBenchmarks'
import {ContactInfoE, type ContactInfo, type StoredContact} from '../domain'
import {getContactsAndTryToResolveThePermissionsAlongTheWay} from '../utils'
import {storedContactsAtom} from './contactsStore'

const contactInfoEquivalence = Schema.equivalence(ContactInfoE)

export const loadingContactsFromDeviceAtom = atom<boolean>(false)

const loadContactsFromDeviceActionAtom = atom(null, (get, set) => {
  return Effect.gen(function* (_) {
    const contactsFromDevice = yield* _(
      getContactsAndTryToResolveThePermissionsAlongTheWay()
    )
    const storedContacts = get(storedContactsAtom)

    const contactsFromDeviceByRawNumber = new Map<string, ContactInfo>(
      Array.map(contactsFromDevice, (c) => [c.rawNumber, c])
    )

    // Preserve object identity for unchanged contacts so derived atoms
    // and the persisted storage blob don't churn on every resume.
    let someContactChanged = false
    const updatedStoredContacts = Array.map(storedContacts, (storedContact) => {
      const infoFromDevice = contactsFromDeviceByRawNumber.get(
        storedContact.info.rawNumber
      )
      if (
        infoFromDevice === undefined ||
        contactInfoEquivalence(infoFromDevice, storedContact.info)
      )
        return storedContact

      someContactChanged = true
      return {...storedContact, info: infoFromDevice} satisfies StoredContact
    })

    const storedContactsRawNumbers = new Set(
      Array.map(storedContacts, (c) => c.info.rawNumber)
    )
    const newContactsToStore = pipe(
      contactsFromDevice,
      Array.filter(
        (contactFromDevice) =>
          !storedContactsRawNumbers.has(contactFromDevice.rawNumber)
      ),
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

    // Skip the write entirely when device contacts are unchanged to avoid
    // a full-blob storage rewrite and derived-atom recomputation.
    if (someContactChanged || Array.isNonEmptyArray(newContactsToStore)) {
      set(storedContactsAtom, [...updatedStoredContacts, ...newContactsToStore])
    }
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
