import {ClubCode} from '@vexl-next/domain/src/general/clubs'
import {ContactHash} from '@vexl-next/domain/src/general/ContactHash.brand'
import {
  E164PhoneNumber,
  E164PhoneNumberUnsafe,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {NormalizedEmail} from '@vexl-next/domain/src/general/NormalizedEmail.brand'
import {ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Option, Schema} from 'effect'

export const NonUniqueContactIdE = Schema.String.pipe(
  Schema.brand('NonUniqueContactId')
)
export type NonUniqueContactId = typeof NonUniqueContactIdE.Type

// Not a device contact id - pairs the phone and email rows of a manually
// added contact
const MANUAL_CONTACT_ID_PREFIX = 'manual:'

export function generateManualContactId(): NonUniqueContactId {
  return Schema.decodeSync(NonUniqueContactIdE)(
    `${MANUAL_CONTACT_ID_PREFIX}${generateUuid()}`
  )
}

export function isManualContactId(id: NonUniqueContactId): boolean {
  return id.startsWith(MANUAL_CONTACT_ID_PREFIX)
}

export const ContactKind = Schema.Literal('phone', 'email')
export type ContactKind = typeof ContactKind.Type

export const ContactInfoE = Schema.Struct({
  // Rows persisted before email contacts existed have no kind
  kind: Schema.optionalWith(ContactKind, {default: () => 'phone' as const}),
  name: Schema.String,
  label: Schema.optionalWith(Schema.String, {as: 'Option'}),
  // optional to not fail when migrating from older versions of vexl where this was not present
  // IMPORTANT: THIS IS NOT AN UNIQUE ID, contact can have multiple numbers and emails, for all of those this will be same
  // Use rawValue for unique id (or normalized value)
  // TODO make the contactId property required at ContactPictureImage, CommonFriendCell
  nonUniqueContactId: Schema.optionalWith(NonUniqueContactIdE, {as: 'Option'}),
  // Phone number or email as found on the device. Persisted under the
  // pre-email key so existing stores decode unchanged.
  rawValue: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey('rawNumber')
  ),
})
export type ContactInfo = typeof ContactInfoE.Type

export const NormalizedContactValue = Schema.Union(
  E164PhoneNumberUnsafe,
  NormalizedEmail
)
export type NormalizedContactValue = typeof NormalizedContactValue.Type

export const ContactComputedValues = Schema.Struct({
  // Persisted under the pre-email key so existing stores decode unchanged
  normalizedValue: Schema.propertySignature(NormalizedContactValue).pipe(
    Schema.fromKey('normalizedNumber')
  ),
  hash: ContactHash,
})
export type ContactComputedValues = typeof ContactComputedValues.Type
export const ContactFlags = Schema.Struct({
  seen: Schema.Boolean,
  imported: Schema.Boolean,
  importedManually: Schema.Boolean,
  invalidNumber: Schema.Literal('notTriedYet', 'valid', 'invalid'),
})
export type ContactFlags = typeof ContactFlags.Type

export const StoredContact = Schema.Struct({
  info: ContactInfoE,
  computedValues: Schema.optionalWith(ContactComputedValues, {as: 'Option'}),
  serverHashToClient: Schema.optionalWith(ServerToClientHashedNumber, {
    as: 'Option',
  }),
  flags: Schema.optionalWith(ContactFlags, {
    default: () => ({
      seen: false,
      imported: false,
      importedManually: false,
      invalidNumber: 'notTriedYet',
    }),
  }),
})
export type StoredContact = typeof StoredContact.Type

export const StoredContactWithComputedValues = Schema.Struct({
  info: ContactInfoE,
  computedValues: ContactComputedValues,
  serverHashToClient: Schema.optionalWith(ServerToClientHashedNumber, {
    as: 'Option',
  }),
  flags: Schema.optionalWith(ContactFlags, {
    default: () => ({
      seen: false,
      imported: false,
      importedManually: false,
      invalidNumber: 'notTriedYet',
    }),
  }),
})
export type StoredContactWithComputedValues =
  typeof StoredContactWithComputedValues.Type

export type StoredContactWithoutComputedValues = StoredContact & {
  computedValues: undefined
}

export function toStoredContact(
  contact: StoredContactWithComputedValues
): StoredContact {
  return {...contact, computedValues: Option.some(contact.computedValues)}
}

export const ImportContactFromLinkPayloadE = Schema.Struct({
  name: Schema.String,
  label: Schema.String,
  numberToDisplay: E164PhoneNumber,
  imageUri: Schema.optional(UriString),
})
export type ImportContactFromLinkPayload =
  typeof ImportContactFromLinkPayloadE.Type

export const ContactsFilterE = Schema.Literal(
  'submitted',
  'nonSubmitted',
  'new',
  'all'
)
export type ContactsFilter = typeof ContactsFilterE.Type

export const JoinClubFromLinkPayload = Schema.Struct({
  code: ClubCode,
})

export type JoinClubFromLinkPayload = Schema.Schema.Type<
  typeof JoinClubFromLinkPayload
>
