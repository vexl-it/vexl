import {parsePhoneNumber} from 'awesome-phonenumber'
import {z} from 'zod'
import {type E164PhoneNumber} from '../general/E164PhoneNumber.brand'

export const RegionCode = z.string().brand<'RegionCode'>()
export type RegionCode = z.TypeOf<typeof RegionCode>

export function phoneNumberToRegionCode(
  phoneNumber: E164PhoneNumber
): RegionCode | undefined {
  const rawRegionCode = parsePhoneNumber(phoneNumber)?.regionCode
  if (rawRegionCode) {
    return RegionCode.parse(rawRegionCode)
  }
}
