import {type CurrencyInfo} from '@vexl-next/domain/src/general/currency.brand'
import {Array, String, pipe} from 'effect'
import {atom} from 'jotai'
import {currencies} from '../../utils/localization/currency'

const allCurrencies = Object.values(currencies)

const matchesCurrency =
  (searchText: string) =>
  (currency: CurrencyInfo): boolean => {
    const lower = String.toLowerCase(searchText)
    return (
      pipe(currency.name, String.toLowerCase, String.includes(lower)) ||
      pipe(currency.code, String.toLowerCase, String.includes(lower))
    )
  }

export const changeCurrencySearchTextAtom = atom('')

export const changeCurrenciesToDisplayAtom = atom((get) => {
  const searchText = get(changeCurrencySearchTextAtom)

  if (String.isEmpty(searchText)) return allCurrencies
  return pipe(allCurrencies, Array.filter(matchesCurrency(searchText)))
})
