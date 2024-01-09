import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'

export default function anonymizePhoneNumber(
  phoneNumber: E164PhoneNumber
): string {
  const first3 = phoneNumber.slice(0, 4)
  const last3 = phoneNumber.slice(-3)
  const numberOfStars = phoneNumber.length - 7
  return `${first3} ${new Array(numberOfStars).fill('*').join('')} ${last3}`
}
