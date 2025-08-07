import {type CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {getDefaultStore} from 'jotai'
import {defaultCurrencyAtom} from './preferences'

function getDefaultCurrency(): CurrencyCode {
  const defaultCurrency = getDefaultStore().get(defaultCurrencyAtom)

  return defaultCurrency
}

export default getDefaultCurrency
