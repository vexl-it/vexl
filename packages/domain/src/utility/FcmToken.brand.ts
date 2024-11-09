import {Brand, Schema} from 'effect'
import {z} from 'zod'

export const FcmToken = z
  .string()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'FcmToken'>>()(v))
export const FcmTokenE = Schema.String.pipe(Schema.brand('FcmToken'))

export type FcmToken = Schema.Schema.Type<typeof FcmTokenE>
