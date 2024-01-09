import {z} from 'zod'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'

export const ContactNormalized = z.object({
  name: z.string(),
  label: z.string().optional(),
  numberToDisplay: z.string(),
  normalizedNumber: E164PhoneNumber,
  imageUri: UriString.optional(),
  fromContactList: z.boolean(),
})

export type ContactNormalized = z.TypeOf<typeof ContactNormalized>
