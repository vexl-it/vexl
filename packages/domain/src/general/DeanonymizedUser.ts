import {Schema} from '@effect/schema'
import {z} from 'zod'
import {E164PhoneNumber, E164PhoneNumberE} from './E164PhoneNumber.brand'
import {UserName, UserNameE} from './UserName.brand'

export const DeanonymizedUser = z
  .object({
    name: UserName,
    partialPhoneNumber: z.string().optional(),
    fullPhoneNumber: E164PhoneNumber.optional(),
  })
  .readonly()

export const DeanonymizedUserE = Schema.Struct({
  name: UserNameE,
  partialPhoneNumber: Schema.optional(Schema.String),
  fullPhoneNumber: Schema.optional(E164PhoneNumberE),
})
export type DeanonymizedUser = z.TypeOf<typeof DeanonymizedUser>
