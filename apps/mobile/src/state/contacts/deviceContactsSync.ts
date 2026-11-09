import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Option, pipe} from 'effect'
import {type StoredContact} from './domain'

export function canDetectContactsRemovedFromPhone(
  rawNumbersOnDevice: ReadonlySet<string> | undefined
): rawNumbersOnDevice is ReadonlySet<string> {
  // An empty read can be a glitch (e.g. iCloud contacts still syncing)
  return rawNumbersOnDevice !== undefined && rawNumbersOnDevice.size > 0
}

const MIN_NUMBERS_REMOVED_AT_ONCE_LIMIT = 10

/**
 * Only numbers that were in the phone at the last sync are removed, so the
 * first sync after an update removes nothing. When too many are missing at
 * once the read is likely incomplete (e.g. contacts still syncing after a phone
 * restore), so nothing is removed.
 */
export function selectNumbersToRemove({
  numbersRemovedFromPhone,
  numbersInPhoneAtLastSync,
  activeContactsCount,
}: {
  readonly numbersRemovedFromPhone: readonly E164PhoneNumber[]
  readonly numbersInPhoneAtLastSync: readonly E164PhoneNumber[] | undefined
  readonly activeContactsCount: number
}): readonly E164PhoneNumber[] {
  if (numbersInPhoneAtLastSync === undefined) return []

  const wasInPhone = new Set(numbersInPhoneAtLastSync)
  const numbersToRemove = Array.filter(numbersRemovedFromPhone, (number) =>
    wasInPhone.has(number)
  )
  const limit = Math.max(
    MIN_NUMBERS_REMOVED_AT_ONCE_LIMIT,
    activeContactsCount / 10
  )
  return numbersToRemove.length > limit ? [] : numbersToRemove
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
 * are dropped unless they are active in the network - those are removed from
 * the network first (removeContactsDeletedFromPhoneActionAtom). Returns the
 * same array when nothing changes.
 */
export function syncStoredContactsWithDevice(
  storedContacts: StoredContact[],
  rawNumbersOnDevice: ReadonlySet<string> | undefined
): StoredContact[] {
  if (!canDetectContactsRemovedFromPhone(rawNumbersOnDevice))
    return storedContacts

  const isOnDevice = createIsOnDevice(storedContacts, rawNumbersOnDevice)
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
