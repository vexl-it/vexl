import {parsePhoneNumber} from 'awesome-phonenumber'
import {Array, Option, pipe, Record} from 'effect/index'
import {atom} from 'jotai'
import {currencies} from '../utils/localization/currency'
import {defaultCurrencyAtom} from '../utils/preferences'
import {userPhoneNumberAtom} from './session/userDataAtoms'

export const defaultCurrencyBaseOnCountryCodeActionAtom = atom(
  null,
  (get, set) => {
    const userPhoneNumber = get(userPhoneNumberAtom)
    const countryCode = parsePhoneNumber(userPhoneNumber).countryCode

    if (countryCode)
      set(
        defaultCurrencyAtom,
        pipe(
          Array.findFirst(Record.values(currencies), (currency) =>
            currency.countryCode.includes(countryCode)
          ),
          Option.map((currency) => currency.code),
          Option.getOrElse(() => currencies.USD.code)
        )
      )
  }
)
