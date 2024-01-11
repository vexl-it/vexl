import {z} from 'zod'
import {UserName} from './UserName.brand'

export const DeanonymizedUser = z.object({
  name: UserName,
  partialPhoneNumber: z.string().optional(),
  fullPhoneNumber: z.string().optional(),
})
export type DeanonymizedUser = z.TypeOf<typeof DeanonymizedUser>
