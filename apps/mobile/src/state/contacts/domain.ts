import {ClubCode} from '@vexl-next/domain/src/general/clubs'
import {
  E164PhoneNumber,
  E164PhoneNumberE,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  UriString,
  UriStringE,
} from '@vexl-next/domain/src/utility/UriString.brand'
import {Schema} from 'effect'
import {z} from 'zod'

export const NonUniqueContactId = z.string().brand('NonUniqueContactId')
export type NonUniqueContactId = z.TypeOf<typeof NonUniqueContactId>

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
export type ContactInfo = z.TypeOf<typeof ContactInfo>

export const ContactComputedValues = z
  .object({
    normalizedNumber: E164PhoneNumber,
    hash: HashedPhoneNumber,
  })
  .readonly()

export type ContactComputedValues = z.TypeOf<typeof ContactComputedValues>

export const ContactFlags = z
  .object({
    seen: z.boolean(),
    imported: z.boolean(),
    importedManually: z.boolean(),
    invalidNumber: z.enum(['notTriedYet', 'valid', 'invalid']),
  })
  .readonly()
export type ContactFlags = z.TypeOf<typeof ContactFlags>

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
export type StoredContact = z.TypeOf<typeof StoredContact>

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
export type StoredContactWithComputedValues = z.TypeOf<
  typeof StoredContactWithComputedValues
>

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

export function hasComputedValues(
  contact: StoredContact
): contact is StoredContactWithComputedValues {
  return !!contact.computedValues
}

export const ContactsFilter = z.enum([
  'submitted',
  'nonSubmitted',
  'new',
  'all',
])

export type ContactsFilter = z.TypeOf<typeof ContactsFilter>

export const JoinClubFromLinkPayload = Schema.Struct({
  code: ClubCode,
})

export type JoinClubFromLinkPayload = Schema.Schema.Type<
  typeof JoinClubFromLinkPayload
>
