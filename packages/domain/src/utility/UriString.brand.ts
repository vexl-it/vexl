import {Schema} from '@effect/schema'
import {Brand} from 'effect'
import {z} from 'zod'

export const UriString = z
  .string()
  .url()
  .transform((v) => {
    return Brand.nominal<typeof v & Brand.Brand<'UriString'>>()(v)
  })
export const UriStringE = Schema.String.pipe(Schema.brand('UriString'))
export type UriString = z.TypeOf<typeof UriString>
