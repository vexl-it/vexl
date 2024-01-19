import {Base64} from 'js-base64'
import {z} from 'zod'
export const Base64String = z
  .string()
  .refine(Base64.isValid)
  .brand<'Base64String'>()
export type Base64String = z.TypeOf<typeof Base64String>
