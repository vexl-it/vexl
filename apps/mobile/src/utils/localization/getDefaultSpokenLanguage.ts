import {type SpokenLanguage} from '@vexl-next/domain/dist/general/offers'
import {i18n} from './I18nProvider'

function getDefaultSpokenLanguage(): SpokenLanguage[] {
  if (i18n.locale === 'pt') return ['PRT']
  if (i18n.locale === 'es') return ['ESP']
  if (i18n.locale === 'de') return ['DEU']
  if (i18n.locale === 'sk') return ['SVK']
  if (i18n.locale === 'cs') return ['CZE']
  if (i18n.locale === 'it') return ['ITA']
  if (i18n.locale === 'fr') return ['FRA']
  return ['ENG']
}

export default getDefaultSpokenLanguage
