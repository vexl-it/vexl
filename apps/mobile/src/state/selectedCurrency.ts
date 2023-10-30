import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'
import {CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {z} from 'zod'
import {focusAtom} from 'jotai-optics'
import {i18n} from '../utils/localization/I18nProvider'

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
    return i18n.locale.split('-')[0] ?? 'en'
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
  z.object({currency: CurrencyCode})
)

export const selectedCurrencyAtom = focusAtom(
  selectedCurrencyStorageAtom,
  (o) => o.prop('currency')
)
