import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Option, pipe} from 'effect'
import {needsNormalization, type StoredContact} from './domain'

export function canDetectContactsRemovedFromPhone(
  rawNumbersOnDevice: ReadonlySet<string> | undefined
): rawNumbersOnDevice is ReadonlySet<string> {
  // An empty read can be a glitch (e.g. iCloud contacts still syncing)
  return rawNumbersOnDevice !== undefined && rawNumbersOnDevice.size > 0
}

function numbersOf(
  contacts: readonly StoredContact[],
  predicate: (contact: StoredContact) => boolean
): ReadonlySet<E164PhoneNumber> {
  return new Set(
    pipe(
      contacts,
      Array.filter(predicate),
      Array.filterMap((contact) =>
        Option.map(contact.computedValues, (one) => one.normalizedNumber)
      )
    )
  )
}

/**
 * Normalized numbers of stored contacts whose raw number is in the address
 * book.
 */
export function findNumbersInPhone(
  storedContacts: readonly StoredContact[],
  rawNumbersOnDevice: ReadonlySet<string>
): ReadonlySet<E164PhoneNumber> {
  return numbersOf(storedContacts, (contact) =>
    rawNumbersOnDevice.has(contact.info.rawNumber)
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
  const numbersInPhone = findNumbersInPhone(storedContacts, rawNumbersOnDevice)

  return (rawNumber, normalizedNumber) =>
    rawNumbersOnDevice.has(rawNumber) ||
    Option.exists(normalizedNumber, (one) => numbersInPhone.has(one))
}

const MIN_MISSING_NUMBERS_LIMIT = 10

/**
 * Numbers that were in the phone at the last sync and are gone now. None when
 * the read can't be trusted: on the first sync after an update, when it is
 * empty, while some address book entries are not normalized yet (they can be
 * a saved number in a new format), or when too many numbers are missing at
 * once (e.g. contacts still syncing after a phone restore).
 */
export function findNumbersDeletedFromPhone({
  storedContacts,
  rawNumbersOnDevice,
  numbersInPhoneAtLastSync,
}: {
  readonly storedContacts: readonly StoredContact[]
  readonly rawNumbersOnDevice: ReadonlySet<string> | undefined
  readonly numbersInPhoneAtLastSync: readonly E164PhoneNumber[] | undefined
}): Option.Option<ReadonlySet<E164PhoneNumber>> {
  if (
    !canDetectContactsRemovedFromPhone(rawNumbersOnDevice) ||
    numbersInPhoneAtLastSync === undefined ||
    Array.some(
      storedContacts,
      (contact) =>
        rawNumbersOnDevice.has(contact.info.rawNumber) &&
        needsNormalization(contact)
    )
  )
    return Option.none()

  const numbersInPhone = findNumbersInPhone(storedContacts, rawNumbersOnDevice)
  const missingNumbers = Array.filter(
    numbersInPhoneAtLastSync,
    (number) => !numbersInPhone.has(number)
  )
  const limit = Math.max(
    MIN_MISSING_NUMBERS_LIMIT,
    numbersInPhoneAtLastSync.length / 10
  )
  return missingNumbers.length > limit
    ? Option.none()
    : Option.some(new Set(missingNumbers))
}

/**
 * Active numbers to remove from the network. A number is kept while any of its
 * contacts was added in Vexl. None when it would take out more than half of
 * the active phone contacts - that is more likely a bad read than the user
 * deleting contacts.
 */
export function findNumbersToRemoveFromNetwork(
  storedContacts: readonly StoredContact[],
  numbersDeletedFromPhone: ReadonlySet<E164PhoneNumber>
): Option.Option<ReadonlySet<E164PhoneNumber>> {
  const numbersAddedInVexl = numbersOf(
    storedContacts,
    (contact) => contact.flags.importedManually
  )
  const activePhoneNumbers = Array.filter(
    Array.fromIterable(
      numbersOf(storedContacts, (contact) => contact.flags.imported)
    ),
    (number) => !numbersAddedInVexl.has(number)
  )
  const numbersToRemove = Array.filter(activePhoneNumbers, (number) =>
    numbersDeletedFromPhone.has(number)
  )
  return numbersToRemove.length * 2 > activePhoneNumbers.length
    ? Option.none()
    : Option.some(new Set(numbersToRemove))
}

/**
 * Makes stored contacts follow the device address book: contacts found in
 * the phone become phone contacts, and inactive phone contacts deleted from
 * the phone are dropped. Active ones are removed from the network first
 * (removeContactsDeletedFromPhoneActionAtom). Returns the same array when
 * nothing changes.
 */
export function syncStoredContactsWithDevice(
  storedContacts: StoredContact[],
  rawNumbersOnDevice: ReadonlySet<string> | undefined,
  numbersInPhoneAtLastSync: readonly E164PhoneNumber[] | undefined
): StoredContact[] {
  if (!canDetectContactsRemovedFromPhone(rawNumbersOnDevice))
    return storedContacts

  const isOnDevice = createIsOnDevice(storedContacts, rawNumbersOnDevice)
  const numbersDeletedFromPhone = Option.getOrElse(
    findNumbersDeletedFromPhone({
      storedContacts,
      rawNumbersOnDevice,
      numbersInPhoneAtLastSync,
    }),
    () => new Set<E164PhoneNumber>()
  )
  let someContactChanged = false

  const syncedContacts = pipe(
    storedContacts,
    Array.filterMap((contact) => {
      const normalizedNumber = Option.map(
        contact.computedValues,
        (one) => one.normalizedNumber
      )

      if (isOnDevice(contact.info.rawNumber, normalizedNumber)) {
        if (!contact.flags.importedManually) return Option.some(contact)

        someContactChanged = true
        return Option.some({
          ...contact,
          flags: {...contact.flags, importedManually: false},
        })
      }

      if (
        contact.flags.importedManually ||
        contact.flags.imported ||
        !Option.exists(normalizedNumber, (one) =>
          numbersDeletedFromPhone.has(one)
        )
      )
        return Option.some(contact)

      someContactChanged = true
      return Option.none()
    })
  )

  return someContactChanged ? syncedContacts : storedContacts
}
