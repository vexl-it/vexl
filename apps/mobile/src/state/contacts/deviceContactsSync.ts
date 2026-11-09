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

export function findActiveNumbers(
  storedContacts: readonly StoredContact[]
): ReadonlySet<E164PhoneNumber> {
  return numbersOf(storedContacts, (contact) => contact.flags.imported)
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

/**
 * What the last trusted sync saw: numbers in the phone, and numbers that were
 * missing for the first time (removed only if still missing on the next sync).
 */
export interface PhoneSyncState {
  readonly numbersInPhone: readonly E164PhoneNumber[]
  readonly numbersMissing: readonly E164PhoneNumber[]
}

export interface NumbersMissingFromPhone {
  readonly missing: ReadonlySet<E164PhoneNumber>
  readonly deleted: ReadonlySet<E164PhoneNumber>
}

function isEveryDeviceNumberResolved(
  storedContacts: readonly StoredContact[],
  rawNumbersOnDevice: ReadonlySet<string>
): boolean {
  const storedByRawNumber = new Map(
    Array.map(storedContacts, (contact) => [contact.info.rawNumber, contact])
  )
  return Array.every(Array.fromIterable(rawNumbersOnDevice), (rawNumber) => {
    const contact = storedByRawNumber.get(rawNumber)
    return contact !== undefined && !needsNormalization(contact)
  })
}

const COMPARED_UNPARSED_DIGITS = 6

/**
 * Whether a number is in the phone. An address book entry Vexl can't parse may
 * still be the number in an unusual format, so a number ending with the last
 * digits of such an entry (before any pause, wait or extension part) counts
 * too.
 */
export function createIsInPhone(
  storedContacts: readonly StoredContact[],
  rawNumbersOnDevice: ReadonlySet<string>
): (number: E164PhoneNumber) => boolean {
  const numbersInPhone = findNumbersInPhone(storedContacts, rawNumbersOnDevice)
  const unparsedEndings = pipe(
    storedContacts,
    Array.filter(
      (contact) =>
        rawNumbersOnDevice.has(contact.info.rawNumber) &&
        Option.isNone(contact.computedValues)
    ),
    Array.map((contact) =>
      (contact.info.rawNumber.split(/ext|[,;#xpw]/i)[0] ?? '').replace(
        /\D/g,
        ''
      )
    ),
    Array.filter((digits) => digits.length >= COMPARED_UNPARSED_DIGITS),
    Array.map((digits) => digits.slice(-COMPARED_UNPARSED_DIGITS))
  )
  return (number) =>
    numbersInPhone.has(number) ||
    Array.some(unparsedEndings, (ending) => number.endsWith(ending))
}

const MIN_MISSING_NUMBERS_LIMIT = 10

/**
 * Numbers that were in the phone at the last sync and are gone now. They count
 * as deleted once missing on two syncs in a row. None when the read can't be
 * trusted: on the first sync after an update, when it is empty, while some
 * address book entries are not stored and normalized yet (they can be a saved
 * number in a new format), or when too many numbers are missing at once (e.g.
 * contacts still syncing after a phone restore).
 */
export function findNumbersMissingFromPhone({
  storedContacts,
  rawNumbersOnDevice,
  lastSync,
}: {
  readonly storedContacts: readonly StoredContact[]
  readonly rawNumbersOnDevice: ReadonlySet<string> | undefined
  readonly lastSync: PhoneSyncState | undefined
}): Option.Option<NumbersMissingFromPhone> {
  if (
    !canDetectContactsRemovedFromPhone(rawNumbersOnDevice) ||
    lastSync === undefined ||
    !isEveryDeviceNumberResolved(storedContacts, rawNumbersOnDevice)
  )
    return Option.none()

  const isInPhone = createIsInPhone(storedContacts, rawNumbersOnDevice)
  const missing = Array.filter(
    lastSync.numbersInPhone,
    (number) => !isInPhone(number)
  )
  const limit = Math.max(
    MIN_MISSING_NUMBERS_LIMIT,
    lastSync.numbersInPhone.length / 10
  )
  if (missing.length > limit) return Option.none()

  const missingAtLastSync = new Set(lastSync.numbersMissing)
  return Option.some({
    missing: new Set(missing),
    deleted: new Set(
      Array.filter(missing, (number) => missingAtLastSync.has(number))
    ),
  })
}

/**
 * State after a sync that removed nothing: newly seen numbers are added, the
 * rest is kept so nothing missing is forgotten. Numbers back in the phone are
 * no longer missing.
 */
export function keepPhoneSyncState(
  lastSync: PhoneSyncState | undefined,
  storedContacts: readonly StoredContact[],
  rawNumbersOnDevice: ReadonlySet<string>
): PhoneSyncState {
  const isInPhone = createIsInPhone(storedContacts, rawNumbersOnDevice)
  return {
    numbersInPhone: Array.fromIterable(
      new Set([
        ...(lastSync?.numbersInPhone ?? []),
        ...findNumbersInPhone(storedContacts, rawNumbersOnDevice),
      ])
    ),
    numbersMissing: Array.filter(
      lastSync?.numbersMissing ?? [],
      (number) => !isInPhone(number)
    ),
  }
}

/**
 * State after a sync that handled the deleted numbers: numbers missing for the
 * first time stay remembered to be confirmed on the next sync.
 */
export function nextPhoneSyncState(
  numbersInPhone: ReadonlySet<E164PhoneNumber>,
  {missing, deleted}: NumbersMissingFromPhone
): PhoneSyncState {
  const missingForFirstTime = Array.filter(
    Array.fromIterable(missing),
    (number) => !deleted.has(number)
  )
  return {
    numbersInPhone: [...numbersInPhone, ...missingForFirstTime],
    numbersMissing: missingForFirstTime,
  }
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
    Array.fromIterable(findActiveNumbers(storedContacts)),
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
  lastSync: PhoneSyncState | undefined
): StoredContact[] {
  if (!canDetectContactsRemovedFromPhone(rawNumbersOnDevice))
    return storedContacts

  const isOnDevice = createIsOnDevice(storedContacts, rawNumbersOnDevice)
  const numbersDeletedFromPhone = pipe(
    findNumbersMissingFromPhone({storedContacts, rawNumbersOnDevice, lastSync}),
    Option.match({
      onNone: () => new Set<E164PhoneNumber>(),
      onSome: ({deleted}) => deleted,
    })
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
