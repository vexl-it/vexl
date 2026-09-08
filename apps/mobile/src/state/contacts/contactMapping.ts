import {Array, Option, Schema, pipe} from 'effect'
import {
  NonUniqueContactIdE,
  type ContactInfo,
  type ContactKind,
  type NonUniqueContactId,
} from './domain'

const DevicePhoneNumber = Schema.Struct({
  label: Schema.optional(Schema.Unknown),
  number: Schema.optional(Schema.Unknown),
})

const DeviceEmail = Schema.Struct({
  label: Schema.optional(Schema.Unknown),
  address: Schema.optional(Schema.Unknown),
})

const DeviceContact = Schema.Struct({
  firstName: Schema.optional(Schema.Unknown),
  id: Schema.optional(Schema.Unknown),
  lastName: Schema.optional(Schema.Unknown),
  name: Schema.optional(Schema.Unknown),
  phoneNumbers: Schema.optional(Schema.NullishOr(Schema.Array(Schema.Unknown))),
  emails: Schema.optional(Schema.NullishOr(Schema.Array(Schema.Unknown))),
})
type DeviceContact = typeof DeviceContact.Type

export interface DeviceContactsMappingResult {
  readonly contacts: ContactInfo[]
  readonly malformedContactsCount: number
  readonly malformedPhoneNumbersCount: number
  readonly malformedEmailsCount: number
}

const decodeDeviceContact = Schema.decodeUnknownOption(DeviceContact)
const decodeDevicePhoneNumber = Schema.decodeUnknownOption(DevicePhoneNumber)
const decodeDeviceEmail = Schema.decodeUnknownOption(DeviceEmail)
const decodeString = Schema.decodeUnknownOption(Schema.String)

const emptyMappingResult: DeviceContactsMappingResult = {
  contacts: [],
  malformedContactsCount: 0,
  malformedPhoneNumbersCount: 0,
  malformedEmailsCount: 0,
}

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

function contactName(contact: DeviceContact, rawValue: string): string {
  return pipe(
    trimmedNonBlankStringFromUnknown(contact.name),
    Option.orElse(() => contactNameFromParts(contact)),
    Option.getOrElse(() => rawValue)
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

interface DeviceContactValue {
  readonly label: unknown
  readonly value: unknown
}

function decodeDeviceValue(
  kind: ContactKind,
  value: unknown
): Option.Option<DeviceContactValue> {
  return kind === 'phone'
    ? pipe(
        decodeDevicePhoneNumber(value),
        Option.map((phone) => ({label: phone.label, value: phone.number}))
      )
    : pipe(
        decodeDeviceEmail(value),
        Option.map((email) => ({label: email.label, value: email.address}))
      )
}

function mapDeviceValue(
  contact: DeviceContact,
  kind: ContactKind,
  value: unknown
): Option.Option<ContactInfo> {
  return pipe(
    decodeDeviceValue(kind, value),
    Option.flatMap((decodedValue) =>
      pipe(
        trimmedNonBlankStringFromUnknown(decodedValue.value),
        Option.map((rawValue) => ({
          kind,
          label: decodeString(decodedValue.label),
          name: contactName(contact, rawValue),
          nonUniqueContactId: nonUniqueContactId(contact),
          rawValue,
        }))
      )
    )
  )
}

function mapDeviceValues(
  contact: DeviceContact,
  kind: ContactKind,
  values: readonly unknown[] | null | undefined
): {readonly contacts: ContactInfo[]; readonly malformedCount: number} {
  return pipe(
    values ?? [],
    Array.reduce(
      {contacts: Array.empty<ContactInfo>(), malformedCount: 0},
      (result, value) =>
        pipe(
          mapDeviceValue(contact, kind, value),
          Option.match({
            onNone: () => ({
              ...result,
              malformedCount: result.malformedCount + 1,
            }),
            onSome: (contactInfo) => ({
              ...result,
              contacts: [...result.contacts, contactInfo],
            }),
          })
        )
    )
  )
}

function mapDeviceContact(contact: DeviceContact): DeviceContactsMappingResult {
  const phones = mapDeviceValues(contact, 'phone', contact.phoneNumbers)
  const emails = mapDeviceValues(contact, 'email', contact.emails)

  return {
    contacts: [...phones.contacts, ...emails.contacts],
    malformedContactsCount: 0,
    malformedPhoneNumbersCount: phones.malformedCount,
    malformedEmailsCount: emails.malformedCount,
  }
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

function sumOf(
  results: readonly DeviceContactsMappingResult[],
  count: (result: DeviceContactsMappingResult) => number
): number {
  return pipe(
    results,
    Array.reduce(0, (sum, result) => sum + count(result))
  )
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
    malformedContactsCount: sumOf(
      mappingResults,
      (result) => result.malformedContactsCount
    ),
    malformedPhoneNumbersCount: sumOf(
      mappingResults,
      (result) => result.malformedPhoneNumbersCount
    ),
    malformedEmailsCount: sumOf(
      mappingResults,
      (result) => result.malformedEmailsCount
    ),
  }
}
