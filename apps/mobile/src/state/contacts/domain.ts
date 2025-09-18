import {ClubCode} from '@vexl-next/domain/src/general/clubs'
import {
  E164PhoneNumberE,
  E164PhoneNumberUnsafe,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {UriStringE} from '@vexl-next/domain/src/utility/UriString.brand'
import {Schema} from 'effect'

export const NonUniqueContactIdE = Schema.String.pipe(
  Schema.brand('NonUniqueContactId')
)
export type NonUniqueContactId = typeof NonUniqueContactIdE.Type

export const ContactInfoE = Schema.Struct({
  name: Schema.String,
  label: Schema.optionalWith(Schema.String, {as: 'Option'}),
  // optional to not fail when migrating from older versions of vexl where this was not present
  // IMPORTANT: THIS IS NOT AN UNIQUE ID, contact can have multiple numbers for all those numbers this will be same
  // Use rawNumber for unique id (or normalized number)
  // TODO make the contactId property required at ContactPictureImage, CommonFriendCell
  nonUniqueContactId: Schema.optionalWith(NonUniqueContactIdE, {as: 'Option'}),
  numberToDisplay: Schema.String,
  rawNumber: Schema.String,
})
export type ContactInfo = typeof ContactInfoE.Type

export const ContactComputedValuesE = Schema.Struct({
  normalizedNumber: E164PhoneNumberUnsafe,
  hash: HashedPhoneNumberE,
})
export type ContactComputedValues = typeof ContactComputedValuesE.Type

export const ContactFlagsE = Schema.Struct({
  seen: Schema.Boolean,
  imported: Schema.Boolean,
  importedManually: Schema.Boolean,
  invalidNumber: Schema.Literal('notTriedYet', 'valid', 'invalid'),
})
export type ContactFlags = typeof ContactFlagsE.Type

export const StoredContactE = Schema.Struct({
  info: ContactInfoE,
  computedValues: Schema.optionalWith(ContactComputedValuesE, {as: 'Option'}),
  flags: Schema.optionalWith(ContactFlagsE, {
    default: () => ({
      seen: false,
      imported: false,
      importedManually: false,
      invalidNumber: 'notTriedYet',
    }),
  }),
})
export type StoredContact = typeof StoredContactE.Type

export const StoredContactWithComputedValuesE = Schema.Struct({
  info: ContactInfoE,
  computedValues: ContactComputedValuesE,
  flags: Schema.optionalWith(ContactFlagsE, {
    default: () => ({
      seen: false,
      imported: false,
      importedManually: false,
      invalidNumber: 'notTriedYet',
    }),
  }),
})
export type StoredContactWithComputedValues =
  typeof StoredContactWithComputedValuesE.Type

export type StoredContactWithoutComputedValues = StoredContact & {
  computedValues: undefined
}

export const ImportContactFromLinkPayloadE = Schema.Struct({
  name: Schema.String,
  label: Schema.String,
  numberToDisplay: E164PhoneNumberE,
  imageUri: Schema.optional(UriStringE),
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
