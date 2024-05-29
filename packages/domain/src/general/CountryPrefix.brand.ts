import {Schema} from '@effect/schema'
import {Brand} from 'effect'
import {z} from 'zod'

export const CountryPrefixE = Schema.Number.pipe(Schema.brand('CountryPrefix'))
export const CountryPrefix = z
  .number()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'CountryPrefix'>>()(v))

export type CountryPrefix = Schema.Schema.Type<typeof CountryPrefixE>
