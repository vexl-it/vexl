import {Brand, Schema} from 'effect'
import {z} from 'zod'

export const HashedPhoneNumber = z
  .string()
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'HashedPhoneNumber'>>()(v)
  )
export const HashedPhoneNumberE = Schema.String.pipe(
  Schema.brand('HashedPhoneNumber')
)
export type HashedPhoneNumber = Schema.Schema.Type<typeof HashedPhoneNumberE>
