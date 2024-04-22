import {parsePhoneNumber} from 'awesome-phonenumber'
import * as O from 'fp-ts/Option'
import {z} from 'zod'

export const E164PhoneNumber = z
  .string()
  .refine((value) => {
    return parsePhoneNumber(value).valid
  })
  .brand<'E164PhoneNumber'>()

export type E164PhoneNumber = z.TypeOf<typeof E164PhoneNumber>

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
