import {ClubCode} from '@vexl-next/domain/src/general/clubs'
import {
  E164PhoneNumber,
  E164PhoneNumberE,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  UriString,
  UriStringE,
} from '@vexl-next/domain/src/utility/UriString.brand'
import {Schema} from 'effect'
import {z} from 'zod'

export const NonUniqueContactId = z.string().brand('NonUniqueContactId')
export const NonUniqueContactIdE = Schema.String.pipe(
  Schema.brand('NonUniqueContactId')
)
export type NonUniqueContactId = typeof NonUniqueContactIdE.Type

export const ContactInfo = z
  .object({
    name: z.string(),
    label: z.string().optional(),
    // optional to not fail when migrating from older versions of vexl where this was not present
    // IMPORTANT: THIS IS NOT AN UNIQUE ID, contact can have multiple numbers for all those numbers this will be same
    // Use rawNumber for unique id (or normalized number)
    // TODO make the contactId property required at ContactPictureImage, CommonFriendCell
    nonUniqueContactId: NonUniqueContactId.optional(),
    numberToDisplay: z.string(),
    rawNumber: z.string(),
  })
  .readonly()

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

export const ContactComputedValues = z
  .object({
    normalizedNumber: E164PhoneNumber,
    hash: HashedPhoneNumber,
  })
  .readonly()

export const ContactComputedValuesE = Schema.Struct({
  normalizedNumber: E164PhoneNumberE,
  hash: HashedPhoneNumberE,
})
export type ContactComputedValues = typeof ContactComputedValuesE.Type

export const ContactFlags = z
  .object({
    seen: z.boolean(),
    imported: z.boolean(),
    importedManually: z.boolean(),
    invalidNumber: z.enum(['notTriedYet', 'valid', 'invalid']),
  })
  .readonly()

export const ContactFlagsE = Schema.Struct({
  seen: Schema.Boolean,
  imported: Schema.Boolean,
  importedManually: Schema.Boolean,
  invalidNumber: Schema.Literal('notTriedYet', 'valid', 'invalid'),
})
export type ContactFlags = typeof ContactFlagsE.Type

export const StoredContact = z.object({
  info: ContactInfo,
  computedValues: ContactComputedValues.optional(),
  flags: ContactFlags.default({
    seen: false,
    imported: false,
    importedManually: false,
    invalidNumber: 'notTriedYet',
  }).readonly(),
})

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

export const StoredContactWithComputedValues = z
  .object({
    info: ContactInfo,
    computedValues: ContactComputedValues,
    flags: ContactFlags.default({
      seen: false,
      imported: false,
      importedManually: false,
      invalidNumber: 'notTriedYet',
    }),
  })
  .readonly()

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

export const ImportContactFromLinkPayload = z.object({
  name: z.string(),
  label: z.string(),
  numberToDisplay: E164PhoneNumber,
  imageUri: UriString.optional(),
})
export const ImportContactFromLinkPayloadE = Schema.Struct({
  name: Schema.String,
  label: Schema.String,
  numberToDisplay: E164PhoneNumberE,
  imageUri: Schema.optional(UriStringE),
})
export type ImportContactFromLinkPayload =
  typeof ImportContactFromLinkPayloadE.Type

export const ContactsFilter = z.enum([
  'submitted',
  'nonSubmitted',
  'new',
  'all',
])

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
