import {Brand, Schema} from 'effect'
import {z} from 'zod'

export const UserName = z
  .string()
  .trim()
  .min(1)
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'UserName'>>()(v))

export const UserNameE = Schema.Trim.pipe(
  Schema.minLength(1),
  Schema.brand('UserName')
)

export type UserName = Schema.Schema.Type<typeof UserNameE>
