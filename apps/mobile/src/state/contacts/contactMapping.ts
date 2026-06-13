import {Array, Option, Schema, pipe} from 'effect'
import {
  NonUniqueContactIdE,
  type ContactInfo,
  type NonUniqueContactId,
} from './domain'

const DevicePhoneNumber = Schema.Struct({
  label: Schema.optional(Schema.Unknown),
  number: Schema.optional(Schema.Unknown),
})
type DevicePhoneNumber = typeof DevicePhoneNumber.Type

const DeviceContact = Schema.Struct({
  firstName: Schema.optional(Schema.Unknown),
  id: Schema.optional(Schema.Unknown),
  lastName: Schema.optional(Schema.Unknown),
  name: Schema.optional(Schema.Unknown),
  phoneNumbers: Schema.optional(Schema.NullishOr(Schema.Array(Schema.Unknown))),
})
type DeviceContact = typeof DeviceContact.Type

export interface DeviceContactsMappingResult {
  readonly contacts: ContactInfo[]
  readonly malformedContactsCount: number
  readonly malformedPhoneNumbersCount: number
}

const decodeDeviceContact = Schema.decodeUnknownOption(DeviceContact)
const decodeDevicePhoneNumber = Schema.decodeUnknownOption(DevicePhoneNumber)
const decodeString = Schema.decodeUnknownOption(Schema.String)

const emptyMappingResult: DeviceContactsMappingResult = {
  contacts: [],
  malformedContactsCount: 0,
  malformedPhoneNumbersCount: 0,
}
const emptyPhoneNumbers: readonly unknown[] = []

function nonBlankStringFromUnknown(value: unknown): Option.Option<string> {
  return pipe(
    decodeString(value),
    Option.filter((string) => string.trim().length > 0)
  )
}

function trimmedNonBlankStringFromUnknown(
  value: unknown
): Option.Option<string> {
  return pipe(
    nonBlankStringFromUnknown(value),
    Option.map((string) => string.trim())
  )
}

function contactNameFromParts(contact: DeviceContact): Option.Option<string> {
  const nameFromParts = pipe(
    [contact.firstName, contact.lastName],
    Array.filterMap(trimmedNonBlankStringFromUnknown),
    Array.join(' ')
  )

  return nameFromParts.length === 0 ? Option.none() : Option.some(nameFromParts)
}

function contactName(contact: DeviceContact, rawNumber: string): string {
  return pipe(
    trimmedNonBlankStringFromUnknown(contact.name),
    Option.orElse(() => contactNameFromParts(contact)),
    Option.getOrElse(() => rawNumber)
  )
}

function nonUniqueContactId(
  contact: DeviceContact
): Option.Option<NonUniqueContactId> {
  return pipe(
    nonBlankStringFromUnknown(contact.id),
    Option.flatMap(Schema.decodeUnknownOption(NonUniqueContactIdE))
  )
}

function mapDevicePhoneNumber(
  contact: DeviceContact,
  phoneNumber: unknown
): Option.Option<ContactInfo> {
  return pipe(
    decodeDevicePhoneNumber(phoneNumber),
    Option.flatMap((decodedPhoneNumber: DevicePhoneNumber) => {
      const rawNumber = trimmedNonBlankStringFromUnknown(
        decodedPhoneNumber.number
      )

      if (Option.isNone(rawNumber)) return Option.none()

      return Option.some({
        label: decodeString(decodedPhoneNumber.label),
        name: contactName(contact, rawNumber.value),
        nonUniqueContactId: nonUniqueContactId(contact),
        numberToDisplay: rawNumber.value,
        rawNumber: rawNumber.value,
      })
    })
  )
}

function mapDeviceContact(contact: DeviceContact): DeviceContactsMappingResult {
  return pipe(
    Option.fromNullable(contact.phoneNumbers),
    Option.getOrElse(() => emptyPhoneNumbers),
    Array.reduce(emptyMappingResult, (result, phoneNumber) => {
      const contactInfo = mapDevicePhoneNumber(contact, phoneNumber)

      if (Option.isNone(contactInfo)) {
        return {
          ...result,
          malformedPhoneNumbersCount: result.malformedPhoneNumbersCount + 1,
        }
      }

      return {
        ...result,
        contacts: [...result.contacts, contactInfo.value],
      }
    })
  )
}

function mapUnknownContact(contact: unknown): DeviceContactsMappingResult {
  const decodedContact = decodeDeviceContact(contact)

  if (Option.isNone(decodedContact)) {
    return {
      ...emptyMappingResult,
      malformedContactsCount: 1,
    }
  }

  return mapDeviceContact(decodedContact.value)
}

export function mapContactsFromSystemToDomain(
  contacts: readonly unknown[]
): DeviceContactsMappingResult {
  const mappingResults = pipe(contacts, Array.map(mapUnknownContact))

  return {
    contacts: pipe(
      mappingResults,
      Array.flatMap((result) => result.contacts)
    ),
    malformedContactsCount: pipe(
      mappingResults,
      Array.reduce(0, (sum, result) => sum + result.malformedContactsCount)
    ),
    malformedPhoneNumbersCount: pipe(
      mappingResults,
      Array.reduce(0, (sum, result) => sum + result.malformedPhoneNumbersCount)
    ),
  }
}
