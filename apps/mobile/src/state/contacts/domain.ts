import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {z} from 'zod'

export const ContactNormalized = z.object({
  name: z.string(),
  label: z.string().optional(),
  numberToDisplay: z.string(),
  normalizedNumber: E164PhoneNumber,
  imageUri: UriString.optional(),
  fromContactList: z.boolean(),
})

export type ContactNormalized = z.TypeOf<typeof ContactNormalized>

export const ContactNormalizedWithHash = ContactNormalized.extend({
  hash: z.string(),
})
export type ContactNormalizedWithHash = z.TypeOf<
  typeof ContactNormalizedWithHash
>

export const ImportContactFromLinkPayload = z.object({
  name: z.string(),
  label: z.string(),
  numberToDisplay: z.string(),
  imageUri: UriString.optional(),
})
export type ImportContactFromLinkPayload = z.TypeOf<
  typeof ImportContactFromLinkPayload
>
