import {parsePhoneNumber} from 'awesome-phonenumber'
import {Brand, Schema} from 'effect'
import {z} from 'zod'
import {type E164PhoneNumber} from '../general/E164PhoneNumber.brand'

export const RegionCodeE = Schema.NonEmptyString.pipe(
  Schema.brand('RegionCode')
)

export const RegionCode = z
  .string()
  .transform((v) => Brand.nominal<typeof v & Brand.Brand<'RegionCode'>>()(v))

export type RegionCode = Schema.Schema.Type<typeof RegionCodeE>

export function phoneNumberToRegionCode(
  phoneNumber: E164PhoneNumber
): RegionCode | undefined {
  const rawRegionCode = parsePhoneNumber(phoneNumber)?.regionCode
  if (rawRegionCode) {
    return RegionCode.parse(rawRegionCode)
  }
}
