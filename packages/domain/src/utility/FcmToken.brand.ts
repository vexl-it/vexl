import * as S from '@effect/schema/Schema'
import {Brand} from 'effect'
import {z} from 'zod'

export const FcmToken = z
  .string()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'FcmToken'>>()(v))
export const FcmTokenE = S.String.pipe(S.brand('FcmToken'))

export type FcmToken = S.Schema.Type<typeof FcmTokenE>
