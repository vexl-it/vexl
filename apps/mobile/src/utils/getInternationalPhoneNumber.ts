import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {parsePhoneNumber} from 'awesome-phonenumber'

export function getInternationalPhoneNumber(
  phoneNumber: E164PhoneNumber
): string {
  return parsePhoneNumber(phoneNumber).number?.international ?? phoneNumber
}
