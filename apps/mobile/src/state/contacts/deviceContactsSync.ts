import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Option, pipe} from 'effect'
import {type StoredContact} from './domain'

export interface DeviceContactsSnapshot {
  readonly rawNumbers: ReadonlySet<string>
  /**
   * False when contacts access is "limited" (iOS) - the visible contacts are
   * only a subset of the address book, so absence from `rawNumbers` does not
   * prove a contact is missing from the phone.
   */
  readonly isComplete: boolean
}

export function canDetectContactsRemovedFromPhone(
  snapshot: DeviceContactsSnapshot | undefined
): snapshot is DeviceContactsSnapshot {
  // An empty read can be a glitch (e.g. iCloud contacts still syncing)
  return (
    snapshot !== undefined &&
    snapshot.isComplete &&
    snapshot.rawNumbers.size > 0
  )
}

/**
 * A stored contact is on the device when its raw number is in the address
 * book, or when another address book entry has the same normalized number.
 */
export function createIsOnDevice(
  storedContacts: readonly StoredContact[],
  rawNumbersOnDevice: ReadonlySet<string>
): (
  rawNumber: string,
  normalizedNumber: Option.Option<E164PhoneNumber>
) => boolean {
  const normalizedNumbersOnDevice = new Set(
    pipe(
      storedContacts,
      Array.filter((contact) => rawNumbersOnDevice.has(contact.info.rawNumber)),
      Array.filterMap((contact) =>
        Option.map(contact.computedValues, (one) => one.normalizedNumber)
      )
    )
  )

  return (rawNumber, normalizedNumber) =>
    rawNumbersOnDevice.has(rawNumber) ||
    Option.exists(normalizedNumber, (one) => normalizedNumbersOnDevice.has(one))
}

/**
 * Makes stored contacts follow the device address book: contacts found in
 * the phone become phone contacts, and phone contacts deleted from the phone
 * are dropped unless they are active in the network - those wait for the user
 * to decide (contactsRemovedFromPhoneAtom). Returns the same array when
 * nothing changes.
 */
export function syncStoredContactsWithDevice(
  storedContacts: StoredContact[],
  snapshot: DeviceContactsSnapshot | undefined
): StoredContact[] {
  if (!canDetectContactsRemovedFromPhone(snapshot)) return storedContacts

  const isOnDevice = createIsOnDevice(storedContacts, snapshot.rawNumbers)
  let someContactChanged = false

  const syncedContacts = pipe(
    storedContacts,
    Array.filterMap((contact) => {
      if (
        isOnDevice(
          contact.info.rawNumber,
          Option.map(contact.computedValues, (one) => one.normalizedNumber)
        )
      ) {
        if (!contact.flags.importedManually) return Option.some(contact)

        someContactChanged = true
        return Option.some({
          ...contact,
          flags: {...contact.flags, importedManually: false},
        })
      }

      if (contact.flags.importedManually || contact.flags.imported)
        return Option.some(contact)

      someContactChanged = true
      return Option.none()
    })
  )

  return someContactChanged ? syncedContacts : storedContacts
}
