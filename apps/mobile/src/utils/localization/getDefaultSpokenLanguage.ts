import {type SpokenLanguage} from '@vexl-next/domain/src/general/offers'
import {getCurrentLocale} from './I18nProvider'

function getDefaultSpokenLanguage(): SpokenLanguage[] {
  const currentLocale = getCurrentLocale()
  if (currentLocale.split('-').includes('pt')) return ['PRT']
  if (currentLocale.split('-').includes('es')) return ['ESP']
  if (currentLocale.split('-').includes('de')) return ['DEU']
  if (currentLocale.split('-').includes('sk')) return ['SVK']
  if (currentLocale.split('-').includes('cs')) return ['CZE']
  if (currentLocale.split('-').includes('it')) return ['ITA']
  if (currentLocale.split('-').includes('fr')) return ['FRA']
  return ['ENG']
}

export default getDefaultSpokenLanguage
