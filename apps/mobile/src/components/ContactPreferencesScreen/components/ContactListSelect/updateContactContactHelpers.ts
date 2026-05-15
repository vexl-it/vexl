import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Option, pipe} from 'effect'
import type {
  StoredContact,
  StoredContactWithComputedValues,
} from '../../../../state/contacts/domain'
import deduplicate from '../../../../utils/deduplicate'

function contactHasNormalizedNumber(
  contact: StoredContact,
  number: E164PhoneNumber
): boolean {
  return (
    Option.isSome(contact.computedValues) &&
    contact.computedValues.value.normalizedNumber === number
  )
}

export function findImportedContactWithNumber(
  contacts: StoredContact[],
  number: E164PhoneNumber
): Option.Option<StoredContactWithComputedValues> {
  return pipe(
    contacts,
    Array.filterMap((contact) =>
      contact.flags.imported
        ? pipe(
            contact.computedValues,
            Option.filter(
              (computedValues) => computedValues.normalizedNumber === number
            ),
            Option.map((computedValues) => ({
              ...contact,
              computedValues,
            }))
          )
        : Option.none()
    ),
    Array.head
  )
}

export function importedNumbersWithout(
  contacts: StoredContact[],
  numberToRemove: E164PhoneNumber
): E164PhoneNumber[] {
  return pipe(
    contacts,
    Array.filter((contact) => contact.flags.imported),
    Array.filterMap((contact) =>
      pipe(
        contact.computedValues,
        Option.map((computedValues) => computedValues.normalizedNumber)
      )
    ),
    Array.filter((number) => number !== numberToRemove)
  )
}

export function importedNumbersAfterReplacement({
  contacts,
  newNumber,
  originalNumber,
}: {
  readonly contacts: StoredContact[]
  readonly newNumber: E164PhoneNumber
  readonly originalNumber: E164PhoneNumber
}): E164PhoneNumber[] {
  return pipe(
    importedNumbersWithout(contacts, originalNumber),
    Array.append(newNumber),
    deduplicate
  )
}

export function replaceSelectedNumber({
  newNumber,
  originalNumber,
  selectedNumbers,
}: {
  readonly newNumber: E164PhoneNumber
  readonly originalNumber: E164PhoneNumber
  readonly selectedNumbers: Set<E164PhoneNumber>
}): Set<E164PhoneNumber> {
  const newSelectedNumbers = new Set(selectedNumbers)
  newSelectedNumbers.delete(originalNumber)
  newSelectedNumbers.add(newNumber)
  return newSelectedNumbers
}

export function renameComputedContact({
  contact,
  contactName,
}: {
  readonly contact: StoredContactWithComputedValues
  readonly contactName: string
}): StoredContact {
  return {
    ...contact,
    computedValues: Option.some(contact.computedValues),
    info: {
      ...contact.info,
      name: contactName,
    },
  }
}

export function buildUpdatedContact({
  contact,
  contactName,
  hash,
  normalizedNumber,
  numberChanged,
}: {
  readonly contact: StoredContactWithComputedValues
  readonly contactName: string
  readonly hash: StoredContactWithComputedValues['computedValues']['hash']
  readonly normalizedNumber: E164PhoneNumber
  readonly numberChanged: boolean
}): StoredContact {
  return {
    ...contact,
    computedValues: Option.some({
      ...contact.computedValues,
      hash,
      normalizedNumber,
    }),
    flags: {
      ...contact.flags,
      imported: numberChanged ? false : contact.flags.imported,
    },
    info: {
      ...contact.info,
      name: contactName,
      numberToDisplay: normalizedNumber,
      rawNumber: normalizedNumber,
    },
  }
}

export function removeContactsWithNumbers({
  contacts,
  numbers,
}: {
  readonly contacts: StoredContact[]
  readonly numbers: Set<E164PhoneNumber>
}): StoredContact[] {
  return pipe(
    contacts,
    Array.filter(
      (contact) =>
        Option.isNone(contact.computedValues) ||
        !numbers.has(contact.computedValues.value.normalizedNumber)
    )
  )
}

export function replaceContactByNumber({
  contacts,
  number,
  updatedContact,
}: {
  readonly contacts: StoredContact[]
  readonly number: E164PhoneNumber
  readonly updatedContact: StoredContact
}): StoredContact[] {
  return pipe(
    contacts,
    Array.map((contact) =>
      contactHasNormalizedNumber(contact, number) ? updatedContact : contact
    )
  )
}
