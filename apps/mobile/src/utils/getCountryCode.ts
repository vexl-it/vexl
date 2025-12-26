import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Option, Schema} from 'effect/index'
import reportError from './reportError'

const INVALID_COUNTRY_CODE = Schema.decodeSync(CountryPrefix)(-1)
export default function getCountryCode(number: E164PhoneNumber): CountryPrefix {
  const countryCode = Schema.decodeUnknownOption(CountryPrefix)(
    parsePhoneNumber(number).countryCode
  )
  if (Option.isSome(countryCode)) {
    return countryCode.value
  }

  reportError('warn', new Error('Can not get country code from number'), {
    number: number.slice(0, 3),
  })
  return INVALID_COUNTRY_CODE
}
