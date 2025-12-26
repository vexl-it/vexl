import {
  toE164PhoneNumber,
  type E164PhoneNumber,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Option} from 'effect'
import {getDefaultStore} from 'jotai'
import {regionCodeAtom} from '../state/session/userDataAtoms'

export default function toE164PhoneNumberWithDefaultCountryCode(
  number: string,
  countryCodeIfKnown: string | undefined = undefined
): Option.Option<E164PhoneNumber> {
  const firstTry = toE164PhoneNumber(
    number,
    countryCodeIfKnown ?? getDefaultStore().get(regionCodeAtom)
  )
  if (Option.isSome(firstTry)) return firstTry

  // If number, as sent before, is not valid, try to use the user's phone number country code
  return toE164PhoneNumber(number, getDefaultStore().get(regionCodeAtom))
}
