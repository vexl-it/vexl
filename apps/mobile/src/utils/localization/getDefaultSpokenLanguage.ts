import {type SpokenLanguage} from '@vexl-next/domain/dist/general/offers'
import {i18n} from './I18nProvider'

function getDefaultSpokenLanguage(): SpokenLanguage[] {
  if (i18n.locale.split('-').includes('pt')) return ['PRT']
  if (i18n.locale.split('-').includes('es')) return ['ESP']
  if (i18n.locale.split('-').includes('de')) return ['DEU']
  if (i18n.locale.split('-').includes('sk')) return ['SVK']
  if (i18n.locale.split('-').includes('cs')) return ['CZE']
  if (i18n.locale.split('-').includes('it')) return ['ITA']
  if (i18n.locale.split('-').includes('fr')) return ['FRA']
  return ['ENG']
}

export default getDefaultSpokenLanguage
