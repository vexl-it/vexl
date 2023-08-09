import {atom} from 'jotai'
import {type CurrencyInfo} from '@vexl-next/domain/dist/general/currency.brand'
import {currencies} from '../../utils/localization/currency'
import {matchSorter} from 'match-sorter'
import {splitAtom} from 'jotai/utils'

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
