import {Schema} from '@effect/schema'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Brand, Option} from 'effect'
import * as O from 'fp-ts/lib/Option'
import {z} from 'zod'

export const E164PhoneNumber = z
  .string()
  .refine((value) => {
    return parsePhoneNumber(value).valid
  })
  .transform((v) => {
    return Brand.nominal<typeof v & Brand.Brand<'E164PhoneNumber'>>()(v)
  })

export const E164PhoneNumberE = Schema.String.pipe(
  Schema.filter((v) => parsePhoneNumber(v).valid),
  Schema.brand('E164PhoneNumber')
)

export type E164PhoneNumber = Schema.Schema.Type<typeof E164PhoneNumberE>

export function toE164PhoneNumberE(
  unsafe: string,
  regionCode: string | undefined = undefined
): Option.Option<E164PhoneNumber> {
  const fptsoption = toE164PhoneNumber(unsafe, regionCode)

  if (fptsoption._tag === 'Some') {
    return Option.some(fptsoption.value)
  }
  return Option.none()
}

export function toE164PhoneNumber(
  unsafe: string,
  regionCode: string | undefined = undefined
): O.Option<E164PhoneNumber> {
  const {valid, number} = parsePhoneNumber(
    unsafe,
    regionCode
      ? {
          regionCode,
        }
      : {}
  )
  if (valid && number?.e164) {
    return O.some(E164PhoneNumber.parse(number.e164))
  }
  return O.none
}
