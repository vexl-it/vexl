import {Schema} from '@effect/schema'
import {Base64} from 'js-base64'
import {z} from 'zod'
export const Base64String = z
  .string()
  .refine(Base64.isValid)
  .brand<'Base64String'>()
export const Base64StringE = Schema.String.pipe(Schema.filter(Base64.isValid))
export type Base64String = Schema.Schema.Type<typeof Base64StringE>
