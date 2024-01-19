import {type CurrencyInfo} from '@vexl-next/domain/src/general/currency.brand'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {matchSorter} from 'match-sorter'
import {currencies} from '../../utils/localization/currency'

export const searchTextAtom = atom<string>('')

export const currenciesAtom = atom<CurrencyInfo[]>(Object.values(currencies))

export const currenciesToDisplayAtom = atom((get) => {
  const searchText = get(searchTextAtom)
  const currencies = get(currenciesAtom)

  return matchSorter(currencies, searchText, {
    keys: ['name', 'code'],
  })
})

export const currenciesToDisplayAtomsAtom = splitAtom(currenciesToDisplayAtom)
