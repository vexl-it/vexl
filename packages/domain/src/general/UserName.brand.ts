import * as S from '@effect/schema/Schema'
import {Brand} from 'effect'
import {z} from 'zod'

export const UserName = z
  .string()
  .trim()
  .min(1)
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'UserName'>>()(v))

export const UserNameE = S.Trim.pipe(S.minLength(1), S.brand('UserName'))

export type UserName = S.Schema.Type<typeof UserNameE>
