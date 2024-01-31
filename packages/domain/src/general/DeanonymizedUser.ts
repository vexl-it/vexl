import {z} from 'zod'
import {E164PhoneNumber} from './E164PhoneNumber.brand'
import {UserName} from './UserName.brand'

export const DeanonymizedUser = z.object({
  name: UserName,
  partialPhoneNumber: z.string().optional(),
  fullPhoneNumber: E164PhoneNumber.optional(),
})
export type DeanonymizedUser = z.TypeOf<typeof DeanonymizedUser>
