import {parsePhoneNumber} from 'awesome-phonenumber'
import {Option, Schema} from 'effect'

const e164PhoneNumberRegex = /^\+[1-9]\d{1,14}$/
const phoneNumberInputCharactersRegex = /^\s*\+?[()\d\s.-]*$/

function containsOnlyPhoneNumberInputCharacters(value: string): boolean {
  return phoneNumberInputCharactersRegex.test(value)
}

export const E164PhoneNumber = Schema.String.pipe(
  Schema.filter((v) => e164PhoneNumberRegex.test(v)),
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
  if (!containsOnlyPhoneNumberInputCharacters(unsafe)) return Option.none()

  const {valid, number} = parsePhoneNumber(
    unsafe,
    regionCode
      ? {
          regionCode,
        }
      : {}
  )

  if (valid && number?.e164) {
    // parsePhoneNumber already validated the number; decoding through the
    // full E164PhoneNumber schema would run parsePhoneNumber a second time.
    return Option.some(Schema.decodeSync(E164PhoneNumberUnsafe)(number.e164))
  }
  return Option.none()
}

const SHORTEST_NATIONAL_NUMBER_DIGITS = 7

/**
 * Digits of the number without the country code (e.g. 777123456 for
 * +420777123456). Falls back to the last digits when the number doesn't parse.
 */
export function toNationalSignificantNumber(number: E164PhoneNumber): string {
  return (
    parsePhoneNumber(number).number?.significant ??
    number.slice(-SHORTEST_NATIONAL_NUMBER_DIGITS)
  )
}
