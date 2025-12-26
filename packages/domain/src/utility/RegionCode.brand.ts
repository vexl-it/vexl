import {parsePhoneNumber} from 'awesome-phonenumber'
import {Schema, type Option} from 'effect'
import {type E164PhoneNumber} from '../general/E164PhoneNumber.brand'

export const RegionCode = Schema.NonEmptyString.pipe(Schema.brand('RegionCode'))

export type RegionCode = Schema.Schema.Type<typeof RegionCode>

export function phoneNumberToRegionCode(
  phoneNumber: E164PhoneNumber
): Option.Option<RegionCode> {
  const rawRegionCode = parsePhoneNumber(phoneNumber)?.regionCode
  return Schema.decodeUnknownOption(RegionCode)(rawRegionCode)
}
