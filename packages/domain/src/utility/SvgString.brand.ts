import {Brand, Schema} from 'effect'
import {z} from 'zod'

export const SvgString = z
  .object({
    xml: z.string().min(1),
  })
  .readonly()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'SvgString'>>()(v))

export const SvgStringE = Schema.Struct({
  xml: Schema.String.pipe(Schema.minLength(1)),
}).pipe(Schema.brand('SvgString'))

export type SvgString = Schema.Schema.Type<typeof SvgStringE>
