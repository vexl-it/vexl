import {parsePhoneNumber} from 'awesome-phonenumber'
import {Option, Schema} from 'effect'

export const E164PhoneNumber = Schema.String.pipe(
  Schema.filter((v) => parsePhoneNumber(v).valid),
  Schema.brand('E164PhoneNumber')
)
export type E164PhoneNumber = Schema.Schema.Type<typeof E164PhoneNumber>

export const E164PhoneNumberUnsafe = Schema.String.pipe(
  Schema.brand('E164PhoneNumber')
)

export function toE164PhoneNumber(
  unsafe: string,
  regionCode: string | undefined = undefined
): Option.Option<E164PhoneNumber> {
  const {valid, number} = parsePhoneNumber(
    unsafe,
    regionCode
      ? {
          regionCode,
        }
      : {}
  )

  if (valid && number?.e164) {
    return Option.some(Schema.decodeSync(E164PhoneNumber)(number.e164))
  }
  return Option.none()
}
