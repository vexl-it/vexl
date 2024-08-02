import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'
import {getCurrentLocale} from '../utils/localization/I18nProvider'

const euLocales = [
  'at', // Austria
  'be', // Belgium
  'cy', // Cyprus
  'ee', // Estonia
  'fi', // Finland
  'fr', // France
  'de', // Germany
  'gr', // Greece
  'ie', // Ireland
  'it', // Italy
  'lv', // Latvia
  'lt', // Lithuania
  'lu', // Luxembourg
  'mt', // Malta
  'nl', // Netherlands
  'pt', // Portugal
  'sk', // Slovakia
  'si', // Slovenia
  'es', // Spain
]

function getLocale(): string {
  try {
    return getCurrentLocale().split('-')[0] ?? 'en'
  } catch (err) {
    return 'en'
  }
}

const defaultCurrency =
  getLocale() === 'cs' ? 'CZK' : euLocales.includes(getLocale()) ? 'EUR' : 'USD'

export const selectedCurrencyStorageAtom = atomWithParsedMmkvStorage(
  'selectedCurrency',
  {
    currency: defaultCurrency,
  },
  z.object({currency: CurrencyCode}).readonly()
)

export const selectedCurrencyAtom = focusAtom(
  selectedCurrencyStorageAtom,
  (o) => o.prop('currency')
)
