import {
  type E164PhoneNumber,
  toE164PhoneNumber,
} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import * as O from 'fp-ts/Option'
import {getDefaultStore} from 'jotai'
import {countryCodeAtom} from '../state/session'

export default function toE164PhoneNumberWithDefaultCountryCode(
  number: string,
  countryCodeIfKnown: string | undefined = undefined
): O.Option<E164PhoneNumber> {
  const firstTry = toE164PhoneNumber(
    number,
    countryCodeIfKnown ?? getDefaultStore().get(countryCodeAtom)
  )
  if (O.isSome(firstTry)) return firstTry

  // If number, as sent before, is not valid, try to use the user's phone number country code
  return toE164PhoneNumber(number, getDefaultStore().get(countryCodeAtom))
}
